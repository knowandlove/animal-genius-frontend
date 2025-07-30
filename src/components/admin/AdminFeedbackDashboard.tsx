import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Download, Star, TrendingUp, Users, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { lessons } from "@shared/lessons";

interface FeedbackSummary {
  overall: {
    totalFeedback: number;
    averageRating: number;
    uniqueTeachers: number;
  };
  perLesson: {
    lessonId: number;
    totalFeedback: number;
    averageRating: number;
    latestFeedback: string;
  }[];
  recentTrend: {
    date: string;
    count: number;
    averageRating: number;
  }[];
}

interface LessonFeedbackDetail {
  lessonId: number;
  stats: {
    totalFeedback: number;
    averageRating: number;
    distribution: {
      "1": number;
      "2": number;
      "3": number;
      "4": number;
      "5": number;
    };
  };
  feedback: {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    updatedAt: string;
    teacher: {
      id: string;
      fullName: string | null;
      email: string;
      schoolOrganization: string | null;
    };
  }[];
}

export function AdminFeedbackDashboard() {
  const [expandedLesson, setExpandedLesson] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"rating" | "date" | "feedback">("rating");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Fetch feedback summary
  const { data: summary, isLoading: summaryLoading } = useQuery<FeedbackSummary>({
    queryKey: ["/api/classes/admin/feedback/summary"],
    queryFn: () => apiRequest("GET", "/api/classes/admin/feedback/summary"),
  });

  // Fetch detailed feedback for expanded lesson
  const { data: lessonDetail, isLoading: detailLoading } = useQuery<LessonFeedbackDetail>({
    queryKey: [`/api/classes/admin/feedback/lessons/${expandedLesson}`],
    queryFn: () => apiRequest("GET", `/api/classes/admin/feedback/lessons/${expandedLesson}`),
    enabled: !!expandedLesson,
  });

  const handleExportCSV = () => {
    if (!summary) return;

    // Create CSV content
    const headers = ["Lesson", "Average Rating", "Total Feedback", "Latest Feedback"];
    const rows = summary.perLesson.map((lesson) => {
      const lessonInfo = lessons.find((l: any) => l.id === lesson.lessonId);
      return [
        lessonInfo?.title || `Lesson ${lesson.lessonId}`,
        lesson.averageRating.toFixed(2),
        lesson.totalFeedback,
        lesson.latestFeedback ? format(new Date(lesson.latestFeedback), "yyyy-MM-dd") : "N/A",
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lesson-feedback-${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              "h-4 w-4",
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "fill-none text-gray-300"
            )}
          />
        ))}
      </div>
    );
  };

  if (summaryLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No feedback data available.</p>
      </div>
    );
  }

  // Sort lessons based on current sort settings
  const sortedLessons = [...(summary.perLesson || [])].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case "rating":
        comparison = a.averageRating - b.averageRating;
        break;
      case "date":
        comparison = new Date(a.latestFeedback || 0).getTime() - new Date(b.latestFeedback || 0).getTime();
        break;
      case "feedback":
        comparison = a.totalFeedback - b.totalFeedback;
        break;
    }
    return sortOrder === "asc" ? comparison : -comparison;
  });

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.overall.averageRating?.toFixed(2) || "0.00"}
            </div>
            <div className="mt-1">{renderStars(Math.round(summary.overall.averageRating || 0))}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.overall.totalFeedback || 0}</div>
            <p className="text-xs text-muted-foreground">
              From {summary.overall.uniqueTeachers || 0} teachers
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Trend</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.recentTrend.length > 0
                ? `+${summary.recentTrend[summary.recentTrend.length - 1].count}`
                : "0"}
            </div>
            <p className="text-xs text-muted-foreground">Feedback today</p>
          </CardContent>
        </Card>
      </div>

      {/* Lessons Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Lesson Feedback</CardTitle>
          <Button onClick={handleExportCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lesson</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (sortBy === "rating") {
                        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                      } else {
                        setSortBy("rating");
                        setSortOrder("desc");
                      }
                    }}
                    className="h-auto p-0 font-medium"
                  >
                    Rating
                    {sortBy === "rating" && (
                      sortOrder === "asc" ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                    )}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (sortBy === "feedback") {
                        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                      } else {
                        setSortBy("feedback");
                        setSortOrder("desc");
                      }
                    }}
                    className="h-auto p-0 font-medium"
                  >
                    Feedback Count
                    {sortBy === "feedback" && (
                      sortOrder === "asc" ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                    )}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (sortBy === "date") {
                        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                      } else {
                        setSortBy("date");
                        setSortOrder("desc");
                      }
                    }}
                    className="h-auto p-0 font-medium"
                  >
                    Latest Feedback
                    {sortBy === "date" && (
                      sortOrder === "asc" ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                    )}
                  </Button>
                </TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedLessons.map((lesson) => {
                const lessonInfo = lessons.find((l: any) => l.id === lesson.lessonId);
                return (
                  <>
                    <TableRow key={lesson.lessonId} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-medium">
                        {lessonInfo?.title || `Lesson ${lesson.lessonId}`}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {renderStars(Math.round(lesson.averageRating))}
                          <span className="text-sm text-muted-foreground">
                            {lesson.averageRating.toFixed(1)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{lesson.totalFeedback}</TableCell>
                      <TableCell>
                        {lesson.latestFeedback
                          ? format(new Date(lesson.latestFeedback), "MMM d, yyyy")
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedLesson(
                            expandedLesson === lesson.lessonId ? null : lesson.lessonId
                          )}
                        >
                          {expandedLesson === lesson.lessonId ? "Hide" : "View"}
                        </Button>
                      </TableCell>
                    </TableRow>
                    {expandedLesson === lesson.lessonId && lessonDetail && (
                      <TableRow>
                        <TableCell colSpan={5} className="bg-muted/30 p-6">
                          {detailLoading ? (
                            <div className="flex justify-center py-4">
                              <LoadingSpinner size="md" />
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {/* Rating Distribution */}
                              <div className="flex items-center gap-8">
                                <div>
                                  <h4 className="text-sm font-medium mb-2">Rating Distribution</h4>
                                  <div className="space-y-1">
                                    {[5, 4, 3, 2, 1].map((rating) => (
                                      <div key={rating} className="flex items-center gap-2">
                                        <span className="text-sm w-3">{rating}</span>
                                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                        <div className="w-32 bg-gray-200 rounded-full h-2">
                                          <div
                                            className="bg-yellow-400 h-2 rounded-full"
                                            style={{
                                              width: `${
                                                ((lessonDetail.stats.distribution[rating.toString() as keyof typeof lessonDetail.stats.distribution] || 0) /
                                                  lessonDetail.stats.totalFeedback) *
                                                100
                                              }%`,
                                            }}
                                          />
                                        </div>
                                        <span className="text-sm text-muted-foreground">
                                          {lessonDetail.stats.distribution[rating.toString() as keyof typeof lessonDetail.stats.distribution] || 0}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              {/* Individual Feedback */}
                              <div>
                                <h4 className="text-sm font-medium mb-3">Individual Feedback</h4>
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                  {lessonDetail.feedback.map((item) => (
                                    <div
                                      key={item.id}
                                      className="border rounded-lg p-4 space-y-2"
                                    >
                                      <div className="flex items-start justify-between">
                                        <div>
                                          <p className="font-medium">
                                            {item.teacher.fullName || item.teacher.email}
                                          </p>
                                          {item.teacher.schoolOrganization && (
                                            <p className="text-sm text-muted-foreground">
                                              {item.teacher.schoolOrganization}
                                            </p>
                                          )}
                                        </div>
                                        <div className="text-right">
                                          {renderStars(item.rating)}
                                          <p className="text-xs text-muted-foreground mt-1">
                                            {format(new Date(item.updatedAt), "MMM d, yyyy")}
                                          </p>
                                        </div>
                                      </div>
                                      {item.comment && (
                                        <p className="text-sm text-gray-600 mt-2">
                                          {item.comment}
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                  {lessonDetail.feedback.length === 0 && (
                                    <p className="text-center text-muted-foreground py-4">
                                      No detailed feedback available.
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}