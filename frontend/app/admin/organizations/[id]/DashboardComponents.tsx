import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { User, BookOpen, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export function StatCard({ title, value, subtext, icon, trend }: any) {
    return (
        <Card className="rounded-2xl shadow-sm border-slate-100 bg-white">
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">{title}</p>
                        <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                        {icon}
                    </div>
                </div>
                {subtext && <p className="text-xs text-slate-400 mt-2">{subtext}</p>}
                {trend && (
                    <div className="mt-2 flex items-center text-xs font-medium text-emerald-600">
                        <span className='bg-emerald-50 px-1.5 py-0.5 rounded'>+{trend}%</span> <span className="text-slate-400 ml-1">vs last week</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export function ActivityChart({ data }: { data: any[] }) {
    if (!data || data.length === 0) return <div className="h-64 flex items-center justify-center text-slate-400">No activity data</div>;

    return (
        <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <RechartsTooltip
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
            </AreaChart>
        </ResponsiveContainer>
    );
}

export function RecentActivityFeed({ activities }: { activities: any[] }) {
    if (!activities || activities.length === 0) return <div className="p-4 text-center text-slate-400">No recent activity</div>;

    return (
        <div className="space-y-6">
            {activities.map((item, i) => (
                <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                        <div className={`h-2 w-2 rounded-full ${item.type === 'USER_JOINED' ? 'bg-emerald-500' : 'bg-indigo-500'} ring-4 ring-white`}></div>
                        {i !== activities.length - 1 && <div className="w-0.5 grow bg-slate-100 mt-2"></div>}
                    </div>
                    <div className="pb-2">
                        <p className="text-sm font-medium text-slate-800">{item.message}</p>
                        <p className="text-xs text-slate-400 mt-0.5 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {new Date(item.date).toLocaleDateString()}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}

export function CourseSummaryTable({ courses }: { courses: any[] }) {
    if (!courses || courses.length === 0) return <div className="p-6 text-center text-slate-400">No courses yet</div>;
    return (
        <div className="overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className='hover:bg-transparent'>
                        <TableHead>Course</TableHead>
                        <TableHead>Students</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Progress</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {courses.map((c) => (
                        <TableRow key={c.id}>
                            <TableCell className="font-medium text-slate-700">{c.title}</TableCell>
                            <TableCell>{c.students_enrolled}</TableCell>
                            <TableCell>
                                <Badge variant="outline" className={c.status === 'Published' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}>
                                    {c.status}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                                    <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${c.progress}%` }}></div>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
