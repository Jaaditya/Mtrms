import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { restaurantApi } from "@/lib/api";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    ChevronLeft, Store, Users, Calendar,
    MapPin, Phone, CreditCard, Activity,
    ArrowUpRight, ShoppingBag
} from "lucide-react";
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@/components/ui/card";

export default function RestaurantDetails() {
    const { id } = useParams();

    const { data: r, isLoading, error } = useQuery({
        queryKey: ["restaurant", id],
        queryFn: () => restaurantApi.show(id!),
        enabled: !!id,
    });

    if (isLoading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </AdminLayout>
        );
    }

    if (error || !r) {
        return (
            <AdminLayout>
                <div className="p-12 text-center">
                    <h2 className="text-xl font-bold text-destructive">Error Loading Restaurant</h2>
                    <p className="text-muted-foreground mt-2">Could not find the restaurant you are looking for.</p>
                    <Button asChild variant="outline" className="mt-4">
                        <Link to="/restaurants"><ChevronLeft className="h-4 w-4 mr-1" /> Back to List</Link>
                    </Button>
                </div>
            </AdminLayout>
        );
    }

    const stats = [
        { label: "Total Users", value: r.users_count || 0, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
        { label: "Total Orders", value: (r.orders_count || 0).toLocaleString(), icon: ShoppingBag, color: "text-green-500", bg: "bg-green-500/10" },
        { label: "Current Status", value: r.status, icon: Activity, color: r.status === 'Active' ? "text-success" : "text-destructive", bg: r.status === 'Active' ? "bg-success/10" : "bg-destructive/10" },
        { label: "Plan", value: r.plan, icon: CreditCard, color: "text-purple-500", bg: "bg-purple-500/10" },
    ];

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                        <Link to="/restaurants"><ChevronLeft className="h-4 w-4" /></Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Store className="h-6 w-6 text-primary" /> {r.name}
                        </h1>
                        <p className="text-sm text-muted-foreground">Detailed overview and statistics</p>
                    </div>
                    <div className="ml-auto flex gap-2">
                        <Badge variant="outline" className="py-1 px-3 text-xs">ID: #{r.id}</Badge>
                        <Badge className={r.status === 'Active' ? "bg-success/10 text-success border-success/20" : "bg-destructive/10 text-destructive border-destructive/20"} variant="outline">
                            {r.status}
                        </Badge>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((s, i) => (
                        <Card key={i} className="border-border/50 bg-card/50 backdrop-blur-sm">
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className={`h-10 w-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                                    <s.icon className={`h-5 w-5 ${s.color}`} />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{s.label}</p>
                                    <p className="text-xl font-bold">{s.value}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Info */}
                    <Card className="lg:col-span-2 border-border/50 bg-card/50 backdrop-blur-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Information</CardTitle>
                            <CardDescription>Basic details about this establishment</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                            <div className="space-y-4">
                                <div className="flex gap-3">
                                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-semibold text-muted-foreground uppercase">Address</p>
                                        <p className="text-sm">{r.address || "N/A"}</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <Phone className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-semibold text-muted-foreground uppercase">Contact</p>
                                        <p className="text-sm">{r.contact || "N/A"}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex gap-3">
                                    <CreditCard className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-semibold text-muted-foreground uppercase">PAN / VAT</p>
                                        <p className="text-sm">{r.pan || "N/A"}</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <Calendar className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-semibold text-muted-foreground uppercase">Registered On</p>
                                        <p className="text-sm">{new Date(r.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Actions / Links */}
                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Quick Access</CardTitle>
                            <CardDescription>Direct links to restaurant data</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2 py-4">
                            <Button variant="outline" className="w-full justify-between" asChild>
                                <Link to="/users">
                                    <div className="flex items-center gap-2"><Users className="h-4 w-4" /> Users</div>
                                    <ArrowUpRight className="h-4 w-4 opacity-50" />
                                </Link>
                            </Button>
                            <Button variant="outline" className="w-full justify-between" asChild>
                                <Link to="/orders">
                                    <div className="flex items-center gap-2"><ShoppingBag className="h-4 w-4" /> Orders</div>
                                    <ArrowUpRight className="h-4 w-4 opacity-50" />
                                </Link>
                            </Button>
                            <Button variant="outline" className="w-full justify-between" asChild>
                                <Link to="/menu">
                                    <div className="flex items-center gap-2"><Store className="h-4 w-4" /> Menu</div>
                                    <ArrowUpRight className="h-4 w-4 opacity-50" />
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}
