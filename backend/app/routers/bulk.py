"""
Bulk user upload endpoint for creating multiple students at once.
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import csv
import io
from .. import models, schemas, database, auth
from uuid import UUID

router = APIRouter(prefix="/bulk", tags=["bulk"])

@router.post("/users/upload")
async def bulk_upload_users(
    file: UploadFile = File(...),
    organization_id: UUID = None,
    role: str = "STUDENT",  # STUDENT, TEACHER, DEPT_HEAD
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.require_admin)
):
    """
    Bulk upload users from Excel file.
    
    Excel Format varies by role:
    - STUDENT: Full Name | Email | Phone | Organization Path | Roll Number
    - TEACHER/DEPT_HEAD: Full Name | Email | Phone | Department
    """
    
    # Validate file type
    if not (file.filename.endswith('.xlsx') or file.filename.endswith('.xls')):
        raise HTTPException(status_code=400, detail="Only Excel files (.xlsx, .xls) are supported")
    
    # Use current user's organization if not specified
    if not organization_id:
        organization_id = current_user.organization_id
    
    # Read Excel file
    from openpyxl import load_workbook
    from io import BytesIO
    
    contents = await file.read()
    excel_file = BytesIO(contents)
    
    try:
        wb = load_workbook(excel_file, data_only=True)
        # Read from role-specific sheet
        sheet_name = "Students" if role == "STUDENT" else "Teachers" if role == "TEACHER" else "Department Heads"
        ws = wb[sheet_name]
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid Excel file: {str(e)}")
    
    # Fetch org groups for mapping paths to IDs
    org_groups = db.query(models.OrgGroup).filter(
        models.OrgGroup.organization_id == organization_id
    ).all()
    
    # Build full path mapping
    def get_full_path(group_id, groups_dict):
        """Recursively build full path from root to this group"""
        group = groups_dict.get(group_id)
        if not group:
            return ""
        
        if group.parent_id is None:
            return group.name
        else:
            parent_path = get_full_path(group.parent_id, groups_dict)
            return f"{parent_path} → {group.name}"
    
    groups_dict = {g.id: g for g in org_groups}
    
    # Create mapping: full_path -> org_group_id
    path_to_group_id = {}
    for group in org_groups:
        full_path = get_full_path(group.id, groups_dict)
        path_to_group_id[full_path.lower()] = group.id
    
    created_users = []
    errors = []
    
    # Track roll numbers in this upload to detect duplicates
    roll_numbers_in_upload = {}
    
    # Skip header row, start from row 2
    for row_num, row in enumerate(ws.iter_rows(min_row=2, values_only=True), start=2):
        try:
            # Extract values based on role (column structure differs)
            full_name = row[0]      # Column A
            email = row[1]          # Column B
            phone = row[2]          # Column C
            org_path = row[3]       # Column D (Organization Path or Department)
            
            # Roll number only for students
            roll_number = row[4] if role == "STUDENT" and len(row) > 4 else None
            
            # Skip empty rows
            if not full_name and not email:
                continue
            
            # Validate required fields
            if not full_name or not email:
                errors.append(f"Row {row_num}: Missing required fields (Full Name or Email)")
                continue
            
            # Check if user already exists
            existing_user = db.query(models.User).filter(
                models.User.email == str(email).strip()
            ).first()
            
            if existing_user:
                errors.append(f"Row {row_num}: User with email {email} already exists (skipped)")
                continue
            
            # Map organization path to org_group_id
            org_group_id = None
            if org_path:
                path_key = str(org_path).strip().lower()
                if path_key in path_to_group_id:
                    org_group_id = path_to_group_id[path_key]
                else:
                    errors.append(f"Row {row_num}: Invalid organization path '{org_path}'")
                    continue
            
            # Validate roll number uniqueness (only for students)
            if role == "STUDENT" and roll_number and org_group_id:
                roll_num_str = str(roll_number).strip()
                
                # Check within this upload batch
                key = (org_group_id, roll_num_str.lower())
                if key in roll_numbers_in_upload:
                    errors.append(f"Row {row_num}: Duplicate roll number '{roll_num_str}' in upload (already used in row {roll_numbers_in_upload[key]})")
                    continue
                
                # Check in database
                existing_roll = db.query(models.User).filter(
                    models.User.org_group_id == org_group_id,
                    models.User.roll_number == roll_num_str
                ).first()
                
                if existing_roll:
                    errors.append(f"Row {row_num}: Roll number '{roll_num_str}' already exists in this group (used by {existing_roll.full_name})")
                    continue
                
                # Track this roll number
                roll_numbers_in_upload[key] = row_num
            
            # Generate default password (email prefix + "123")
            default_password = str(email).split('@')[0] + "123"
            
            # Create user
            new_user = models.User(
                email=str(email).strip(),
                password_hash=auth.hash_password(default_password),
                full_name=str(full_name).strip(),
                role=role,  # Use the role from parameter
                organization_id=organization_id,
                org_group_id=org_group_id,
                phone=str(phone).strip() if phone else None,
                year=None,  # Year is now part of the path
                roll_number=str(roll_number).strip() if roll_number else None,
                force_password_reset=True  # Force password change on first login
            )
            
            db.add(new_user)
            created_users.append({
                'email': new_user.email,
                'full_name': new_user.full_name,
                'role': role,
                'organization_path': org_path,
                'roll_number': roll_number if role == "STUDENT" else None,
                'default_password': default_password
            })
            
        except Exception as e:
            errors.append(f"Row {row_num}: {str(e)}")
            continue
    
    # Commit all successful creations
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    
    return {
        "message": f"Successfully created {len(created_users)} students",
        "created_count": len(created_users),
        "error_count": len(errors),
        "created_users": created_users,
        "errors": errors
    }


@router.get("/users/template")
def download_excel_template(
    organization_id: UUID = None,
    role: str = "STUDENT",  # STUDENT, TEACHER, DEPT_HEAD
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.require_admin)
):
    """
    Download Excel template for bulk user upload with dropdowns for org structure.
    
    - STUDENT: Shows full hierarchical paths (leaf nodes only)
    - TEACHER/DEPT_HEAD: Shows department level only (top-level groups)
    """
    from openpyxl import Workbook
    from openpyxl.styles import Font, PatternFill, Alignment
    from openpyxl.worksheet.datavalidation import DataValidation
    from io import BytesIO
    from fastapi.responses import StreamingResponse
    
    # Use current user's organization if not specified
    if not organization_id:
        organization_id = current_user.organization_id
    
    # Fetch org groups for dropdowns
    org_groups = db.query(models.OrgGroup).filter(
        models.OrgGroup.organization_id == organization_id
    ).all()
    
    # Create workbook
    wb = Workbook()
    
    # Main sheet for data entry
    ws = wb.active
    sheet_name = "Students" if role == "STUDENT" else "Teachers" if role == "TEACHER" else "Department Heads"
    ws.title = sheet_name
    
    # Headers will be set later based on role
    # Style settings
    header_fill = PatternFill(start_color="4F46E5", end_color="4F46E5", fill_type="solid")
    header_font = Font(bold=True, color="FFFFFF", size=12)
    
    # Set column widths (will adjust based on role later)
    ws.column_dimensions['A'].width = 25  # Full Name
    ws.column_dimensions['B'].width = 30  # Email
    ws.column_dimensions['C'].width = 15  # Phone
    ws.column_dimensions['D'].width = 25  # Department
    ws.column_dimensions['E'].width = 15  # Year
    ws.column_dimensions['F'].width = 15  # Roll Number
    
    # Create reference sheet for dropdowns
    ref_sheet = wb.create_sheet("Reference Data")
    
    # Build org structure based on role
    if role in ["TEACHER", "DEPT_HEAD"]:
        # For Teachers/HODs: Show department level groups
        # First try to get top-level groups (parent_id is None)
        dept_groups = [g for g in org_groups if g.parent_id is None]
        
        print(f"DEBUG: Total org_groups: {len(org_groups)}")
        print(f"DEBUG: Top-level groups found: {len(dept_groups)}")
        print(f"DEBUG: Top-level group names: {[g.name for g in dept_groups]}")
        
        # If no top-level groups, show all groups (might be a flat structure or all are children)
        if not dept_groups:
            dept_groups = org_groups
            print(f"DEBUG: No top-level groups, using all groups: {len(dept_groups)}")
        
        org_options = [g.name for g in dept_groups]
        org_options.sort()
        
        print(f"DEBUG: Final org_options: {org_options}")
        
        # Create mapping for upload
        path_to_group_id = {g.name.lower(): g.id for g in dept_groups}
        
        column_header = "Department"
        column_width = 30
        
    else:  # STUDENT
        # For Students: Show full hierarchical paths (leaf nodes only)
        def get_full_path(group_id, groups_dict):
            """Recursively build full path from root to this group"""
            group = groups_dict.get(group_id)
            if not group:
                return ""
            
            if group.parent_id is None:
                return group.name
            else:
                parent_path = get_full_path(group.parent_id, groups_dict)
                return f"{parent_path} → {group.name}"
        
        # Create a dict for quick lookup
        groups_dict = {g.id: g for g in org_groups}
        
        # Find all leaf nodes (groups with no children)
        all_group_ids = {g.id for g in org_groups}
        parent_ids = {g.parent_id for g in org_groups if g.parent_id}
        leaf_group_ids = all_group_ids - parent_ids
        
        # Build full paths for all leaf nodes
        org_options = []
        path_to_group_id = {}
        
        for leaf_id in leaf_group_ids:
            full_path = get_full_path(leaf_id, groups_dict)
            org_options.append(full_path)
            path_to_group_id[full_path.lower()] = leaf_id
        
        # Sort paths alphabetically
        org_options.sort()
        
        column_header = "Organization Path"
        column_width = 50
    
    # Write options to reference sheet
    ref_sheet['A1'] = f"{column_header} Options"
    ref_sheet['A1'].font = Font(bold=True)
    
    for idx, option in enumerate(org_options, start=2):
        ref_sheet[f'A{idx}'] = option
    
    # Create dropdown
    if org_options:
        validation = DataValidation(
            type="list",
            formula1=f"='Reference Data'!$A$2:$A${len(org_options) + 1}",
            allow_blank=False
        )
        validation.error = f'Please select from the {column_header.lower()} list'
        validation.errorTitle = 'Invalid Selection'
        ws.add_data_validation(validation)
        validation.add(f'D2:D1000')  # Apply to 1000 rows
    
    # Update column header and width
    ws['D1'] = column_header
    ws.column_dimensions['D'].width = column_width
    
    # Remove the Roll Number column for Teachers/HODs
    if role in ["TEACHER", "DEPT_HEAD"]:
        ws.delete_cols(5)  # Delete column E (Roll Number)
        headers = ["Full Name", "Email", "Phone", column_header]
    else:
        # Remove Year/Section column for students (already done in previous logic)
        ws.delete_cols(5)  # Delete column E
        headers = ["Full Name", "Email", "Phone", column_header, "Roll Number"]
    
    # Update headers
    for idx, header in enumerate(headers, start=1):
        ws.cell(row=1, column=idx, value=header)
        ws.cell(row=1, column=idx).fill = header_fill
        ws.cell(row=1, column=idx).font = header_font
        ws.cell(row=1, column=idx).alignment = Alignment(horizontal="center", vertical="center")
    
    # Add sample rows with instructions
    ws['A2'] = "John Doe"
    ws['B2'] = "john.doe@example.com"
    ws['C2'] = "1234567890"
    ws['D2'] = org_options[0] if org_options else "Select from dropdown"
    if role == "STUDENT":
        ws['E2'] = "CS001"
    
    ws['A3'] = "Jane Smith"
    ws['B3'] = "jane.smith@example.com"
    ws['C3'] = "0987654321"
    ws['D3'] = org_options[0] if org_options else "Select from dropdown"
    if role == "STUDENT":
        ws['E3'] = "CS002"
    
    # Add instructions sheet
    inst_sheet = wb.create_sheet("Instructions", 0)
    inst_sheet['A1'] = f"Bulk {role.title()} Upload - Instructions"
    inst_sheet['A1'].font = Font(bold=True, size=14, color="4F46E5")
    
    if role in ["TEACHER", "DEPT_HEAD"]:
        instructions = [
            "",
            "1. Fill in the sheet with user details",
            "2. Full Name and Email are required fields",
            "3. Use the dropdown in 'Department' column to select the department",
            "4. Phone number should include country code (e.g., +91 for India)",
            "",
            "5. Default passwords will be auto-generated as: email_prefix + '123'",
            "   Example: john.doe@example.com → Password: john.doe123",
            "",
            "6. Users will be forced to change password on first login",
            "",
            "7. Save this file and upload it through the bulk upload interface",
            "",
            "Note: Do not modify the 'Reference Data' sheet - it contains dropdown options"
        ]
    else:  # STUDENT
        instructions = [
            "",
            "1. Fill in the 'Students' sheet with student details",
            "2. Full Name and Email are required fields",
            "3. Use the dropdown in 'Organization Path' column to select the full hierarchical path",
            "   Example: Engineering → Computer Science → Year 2 → Section A",
            "4. The dropdown shows the complete path from top level to the specific group/section",
            "5. Roll Number is optional but recommended for students",
            "6. Phone number should include country code (e.g., +91 for India)",
            "",
            "7. Default passwords will be auto-generated as: email_prefix + '123'",
            "   Example: john.doe@example.com → Password: john.doe123",
            "",
            "8. Students will be forced to change password on first login",
            "",
            "9. Save this file and upload it through the bulk upload interface",
            "",
            "Note: Do not modify the 'Reference Data' sheet - it contains dropdown options"
        ]
    
    for idx, instruction in enumerate(instructions, start=2):
        inst_sheet[f'A{idx}'] = instruction
        if instruction and instruction[0].isdigit():
            inst_sheet[f'A{idx}'].font = Font(size=11)
    
    inst_sheet.column_dimensions['A'].width = 80
    
    # Save to BytesIO
    excel_file = BytesIO()
    wb.save(excel_file)
    excel_file.seek(0)
    
    return StreamingResponse(
        excel_file,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=bulk_students_template_{organization_id}.xlsx"}
    )
