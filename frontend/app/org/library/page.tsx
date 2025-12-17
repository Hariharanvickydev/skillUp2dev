"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getLibraryCourses, importLibraryCourse } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
    Book,
    Search,
    Filter,
    Layers,
    Star,
    Eye,
    Check,
    Tag,
    BookOpen,
    ChevronDown,
    Download,
    Loader2,
    Info,
    AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export default function OrgLibraryPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCourse, setSelectedCourse] = useState<any>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    // Import State
    const [isImportConfirmOpen, setIsImportConfirmOpen] = useState(false);
    const [importLoading, setImportLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("all");

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [difficulty, setDifficulty] = useState("All Levels");
    const [category, setCategory] = useState("All Categories");

    useEffect(() => {
        loadCourses();
    }, [searchQuery, difficulty, category]);

    const loadCourses = async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (searchQuery) params.search = searchQuery;
            if (difficulty && difficulty !== "All Levels") params.difficulty = difficulty;
            if (category && category !== "All Categories") params.category = category;

            const data = await getLibraryCourses(params);
            setCourses(data);
        } catch (e) {
            toast.error("Failed to load library courses");
        } finally {
            setLoading(false);
        }
    };

    const handleAction = (course: any) => {
        if (course.existing_clone_id) {
            // Already imported -> Go to Manage/Sync
            // We'll treat this as "Manage" which might go to editor or sync
            // Per user request, maybe go to Sync page directly? Or Course page?
            // "we can import them ... process ... import"
            // Let's go to Course Page for now, user can find Sync there.
            router.push(`/org/courses/${course.existing_clone_id}`)
        } else {
            // Not imported -> Preview First
            router.push(`/org/library/preview/${course.id}`)
        }
    };

    const handleImportClick = () => {
        if (!selectedCourse) return;
        setIsImportConfirmOpen(true);
    };

    const confirmImport = async () => {
        if (!user?.organization_id || !selectedCourse) return;

        setImportLoading(true);
        try {
            const result = await importLibraryCourse(selectedCourse.id, user.organization_id);
            toast.success("Course imported successfully");
            setIsImportConfirmOpen(false);
            setIsSheetOpen(false);

            // Redirect to the new course (Draft)
            if (result.new_course_id) {
                router.push(`/org/courses/${result.new_course_id}`);
            } else {
                router.push('/org/courses');
            }
        } catch (e: any) {
            console.error(e);
            toast.error(e.response?.data?.detail || "Failed to import course");
        } finally {
            setImportLoading(false);
        }
    };

    const categories = ["All Categories", "Computer Science", "Data Science", "Business", "Design", "Mathematics"];
    const difficulties = ["All Levels", "Beginner", "Intermediate", "Advanced"];

    return (
        <div className="max-w-7xl mx-auto p-6 lg:p-10 space-y-8 pb-20">
            {/* Header */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 p-8 text-white shadow-2xl shadow-indigo-900/20">
                <div className="absolute top-0 right-0 -mt-20 -mr-20 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-80 w-80 rounded-full bg-purple-500/20 blur-3xl"></div>

                <div className="relative z-10 space-y-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold backdrop-blur-md">
                                <Book className="h-3.5 w-3.5" /> Course Marketplace
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight">Browse Library</h1>
                            <p className="text-indigo-200 lg:max-w-xl">
                                Import world-class curriculum directly into your organization. Customize it to fit your needs.
                            </p>
                        </div>
                    </div>

                    {/* View Filters via Tabs */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="bg-slate-950/30 p-1.5 rounded-xl border border-white/10 w-fit backdrop-blur-md">
                            <TabsTrigger
                                value="all"
                                className={cn(
                                    "rounded-lg px-4 py-2 text-sm font-medium transition-all duration-300",
                                    activeTab === "all"
                                        ? "!bg-white !text-indigo-600 shadow-lg shadow-indigo-900/10"
                                        : "text-indigo-200 hover:text-white hover:bg-white/5"
                                )}
                            >
                                All Courses
                            </TabsTrigger>
                            <TabsTrigger
                                value="imported"
                                className={cn(
                                    "rounded-lg px-4 py-2 text-sm font-medium transition-all duration-300",
                                    activeTab === "imported"
                                        ? "!bg-white !text-indigo-600 shadow-lg shadow-indigo-900/10"
                                        : "text-indigo-200 hover:text-white hover:bg-white/5"
                                )}
                            >
                                Already Imported
                            </TabsTrigger>
                            <TabsTrigger
                                value="new"
                                className={cn(
                                    "rounded-lg px-4 py-2 text-sm font-medium transition-all duration-300",
                                    activeTab === "new"
                                        ? "!bg-white !text-indigo-600 shadow-lg shadow-indigo-900/10"
                                        : "text-indigo-200 hover:text-white hover:bg-white/5"
                                )}
                            >
                                Not Imported
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    {/* Filters */}
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2 border border-white/10 flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-200 group-focus-within:text-white transition-colors" />
                            <Input
                                placeholder="Search topic, title..."
                                className="pl-12 border-0 bg-transparent h-12 text-base text-white placeholder:text-indigo-200/60 focus-visible:ring-0"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2 p-1">
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger className="w-[180px] h-10 rounded-xl border-white/10 bg-white/10 text-white hover:bg-white/20">
                                    <SelectValue placeholder="Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Select value={difficulty} onValueChange={setDifficulty}>
                                <SelectTrigger className="w-[160px] h-10 rounded-xl border-white/10 bg-white/10 text-white hover:bg-white/20">
                                    <SelectValue placeholder="Difficulty" />
                                </SelectTrigger>
                                <SelectContent>
                                    {difficulties.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-72 bg-slate-100 rounded-2xl animate-pulse"></div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses
                        .filter(course => {
                            if (activeTab === "imported") return course.existing_clone_id;
                            if (activeTab === "new") return !course.existing_clone_id;
                            return true;
                        })
                        .map(course => (
                            <div
                                key={course.id}
                                className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
                            >
                                <div className={`h-32 w-full bg-gradient-to-r ${getGradient(course.category)} relative`}>
                                    <div className="absolute bottom-4 left-6">
                                        <Badge className="bg-white/90 text-slate-900 shadow-sm backdrop-blur-md">
                                            {course.category || "General"}
                                        </Badge>
                                    </div>
                                    {course.existing_clone_id && (
                                        <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-2 py-1 rounded-lg text-xs font-semibold text-white border border-white/30 flex items-center gap-1">
                                            <Check className="h-3 w-3" /> Imported
                                        </div>
                                    )}
                                </div>
                                <div className="p-6 flex-1 flex flex-col">
                                    <h3 className="text-xl font-bold text-slate-900 line-clamp-2 mb-2 group-hover:text-indigo-600 transition-colors">
                                        {course.title}
                                    </h3>
                                    <p className="text-slate-500 text-sm line-clamp-2 mb-4 flex-1">
                                        {course.description}
                                    </p>
                                    <div className="flex items-center gap-4 text-sm text-slate-600 mb-6">
                                        <div className="flex items-center gap-1.5">
                                            <Layers className="h-4 w-4 text-indigo-500" />
                                            <span>{course.topics?.length || 0} Modules</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Star className="h-4 w-4 text-orange-400" />
                                            <span>{course.difficulty || "Beginner"}</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    {course.existing_clone_id ? (
                                        <div className="grid grid-cols-2 gap-2">
                                            <Button
                                                variant="outline"
                                                className="w-full border-slate-200 hover:border-indigo-300 text-slate-600 hover:text-indigo-600"
                                                onClick={() => router.push(`/org/library/preview/${course.id}`)}
                                            >
                                                <Eye className="h-4 w-4 mr-2" /> Preview
                                            </Button>
                                            <Button
                                                className="w-full bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                                                onClick={() => handleAction(course)}
                                            >
                                                Manage
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button
                                            className="w-full font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800"
                                            onClick={() => handleAction(course)}
                                        >
                                            Preview & Import
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    {courses.length === 0 && (
                        <div className="col-span-full py-20 text-center text-slate-400">
                            No courses found matching your filters.
                        </div>
                    )}
                </div>
            )}

            {/* Preview Sheet */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent side="right" className="sm:max-w-xl overflow-y-auto w-full">
                    <SheetHeader>
                        <Badge className="w-fit mb-2">{selectedCourse?.category}</Badge>
                        <SheetTitle className="text-2xl font-bold">{selectedCourse?.title}</SheetTitle>
                        <SheetDescription className="text-base">
                            {selectedCourse?.description}
                        </SheetDescription>
                    </SheetHeader>

                    <div className="py-8 space-y-8">
                        {/* Stats */}
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg flex-1 justify-center border border-slate-100">
                                <Layers className="h-5 w-5 text-indigo-500" />
                                <div className="text-sm">
                                    <span className="font-bold block text-lg">{selectedCourse?.topics?.length || 0}</span> Modules
                                </div>
                            </div>
                            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg flex-1 justify-center border border-slate-100">
                                <Star className="h-5 w-5 text-orange-500" />
                                <div className="text-sm">
                                    <span className="font-bold block text-lg">{selectedCourse?.difficulty}</span> Level
                                </div>
                            </div>
                        </div>

                        {/* Outcomes */}
                        {selectedCourse?.outcomes?.length > 0 && (
                            <div>
                                <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                    <Tag className="h-4 w-4 text-emerald-600" /> What Students Will Learn
                                </h4>
                                <ul className="space-y-2">
                                    {selectedCourse.outcomes.map((outcome: string, idx: number) => (
                                        <li key={idx} className="flex gap-2 text-sm text-slate-600">
                                            <Check className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                            <span>{outcome}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Syllabus */}
                        <div>
                            <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-indigo-600" /> Syllabus Preview
                            </h4>
                            <div className="space-y-3">
                                {selectedCourse?.topics?.slice(0, 5).map((topic: any, idx: number) => (
                                    <div key={topic.id} className="p-4 border border-slate-100 rounded-xl bg-white flex gap-3">
                                        <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0">
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <h5 className="font-medium text-slate-900">{topic.title}</h5>
                                            <p className="text-xs text-slate-500 line-clamp-1">{topic.description}</p>
                                        </div>
                                    </div>
                                ))}
                                {(selectedCourse?.topics?.length || 0) > 5 && (
                                    <div className="text-center text-sm text-slate-500 italic p-2">
                                        + {(selectedCourse?.topics?.length || 0) - 5} more modules...
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <SheetFooter className="border-t pt-6 mt-auto">
                        <Button
                            size="lg"
                            className="w-full bg-indigo-600 hover:bg-indigo-700 font-bold text-lg h-14 shadow-xl shadow-indigo-200"
                            onClick={handleImportClick}
                        >
                            <Download className="mr-2 h-5 w-5" /> Import Course
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            {/* Confirmation Dialog */}
            <Dialog open={isImportConfirmOpen} onOpenChange={setIsImportConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Import Course?</DialogTitle>
                        <DialogDescription>
                            This will clone <strong>{selectedCourse?.title}</strong> into your organization.
                            You will be able to edit the content independently.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3 items-start">
                        <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-amber-800">
                            <strong>Note:</strong> Exams and Important Questions marked as "Draft" will also be copied. You can publish them later.
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsImportConfirmOpen(false)}>Cancel</Button>
                        <Button
                            className="bg-indigo-600 hover:bg-indigo-700"
                            onClick={confirmImport}
                            disabled={importLoading}
                        >
                            {importLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                            {importLoading ? "Cloning..." : "Confirm & Import"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function getGradient(category: string) {
    if (!category) return "from-indigo-500 to-purple-600";
    if (category.includes("Computer")) return "from-blue-600 to-indigo-600";
    if (category.includes("Data")) return "from-emerald-500 to-teal-600";
    if (category.includes("Business")) return "from-orange-500 to-amber-600";
    if (category.includes("Design")) return "from-pink-500 to-rose-600";
    return "from-slate-500 to-slate-600";
}
