# Add this endpoint to /backend/app/routers/topics.py after the existing endpoints

@router.post("/{module_id}/republish")
def republish_module(
    module_id: UUID,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """
    Re-publish a module after reviewing updates to approved content.
    Only HOD and Admins can re-publish.
    """
    # Permission check: HOD or Admin only
    if current_user.role not in [models.UserRole.DEPT_HEAD, models.UserRole.ORG_ADMIN, models.UserRole.SUPER_ADMIN]:
        raise HTTPException(status_code=403, detail="Only HOD or Admin can re-publish modules")
    
    module = db.query(models.Topic).filter(models.Topic.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    # Verify this is a module (parent topic)
    if module.parent_topic_id is not None:
        raise HTTPException(status_code=400, detail="Can only republish modules, not sub-topics")
    
    # Verify all children topics are APPROVED
    children = db.query(models.Topic).filter(models.Topic.parent_topic_id == module_id).all()
    for child in children:
        if child.status != "APPROVED":
            raise HTTPException(
                status_code=400, 
                detail=f"Topic '{child.title}' is not approved. All topics must be approved before publishing."
            )
    
    # Re-publish the module
    module.is_published = True
    
    # Clear pending updates flag on course
    course = module.course
    if course:
        course.has_pending_updates = False
    
    db.commit()
    db.refresh(module)
    
    return {"message": "Module re-published successfully", "module": module}
