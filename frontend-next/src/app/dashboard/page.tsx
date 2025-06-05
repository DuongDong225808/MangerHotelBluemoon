'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, Users, Receipt, DollarSign, UserPlus, UserMinus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

interface User {
    token: string;
}

interface Stats {
    counts: {
        households: number;
        residents: number;
        fees: number;
        temporaryResidences: number;
        temporaryAbsences: number;
    };
    financials: {
        monthlyRevenue: number;
        revenueByType: Record<string, number>;
        monthlyTrend: {
            labels: string[];
            data: number[];
        };
        displayMonthName?: string;
    };
    recentPayments: Array<{
        _id: string;
        household?: {
            apartmentNumber: string;
        };
        fee?: {
            name: string;
        };
        amount: number;
        paymentDate: string;
    }>;
}

const DashboardPage = () => {
    const { user } = useAuth() as { user: User | null };
    const [stats, setStats] = useState<Stats>({
        counts: {
            households: 0,
            residents: 0,
            fees: 0,
            temporaryResidences: 0,
            temporaryAbsences: 0
        },
        financials: {
            monthlyRevenue: 0,
            revenueByType: {},
            monthlyTrend: {
                labels: [],
                data: []
            }
        },
        recentPayments: []
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                if (!user?.token) return;

                const response = await fetch('/api/statistics/dashboard', {
                    headers: {
                        'Authorization': `Bearer ${user.token}`,
                    },
                });

                if (!response.ok) throw new Error('Không thể tải dữ liệu tổng quan');

                const data = await response.json();
                setStats(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [user]);

    // Prepare data for revenue by fee type chart
    const revenueByTypeData = useMemo(() => {
        const colors = {
            backgroundColor: [
                'rgba(255, 99, 132, 0.6)',
                'rgba(54, 162, 235, 0.6)',
                'rgba(255, 206, 86, 0.6)',
                'rgba(75, 192, 192, 0.6)',
                'rgba(153, 102, 255, 0.6)',
                'rgba(255, 159, 64, 0.6)',
                'rgba(199, 199, 199, 0.6)'
            ],
            borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)',
                'rgba(199, 199, 199, 1)'
            ]
        };

        const revenueEntries = Object.entries(stats.financials.revenueByType)
            .filter(([_, value]) => value > 0)
            .sort((a, b) => b[1] - a[1]);

        const labels = revenueEntries.map(([label, value]) =>
            `${label}: ${value.toLocaleString()} VND`
        );
        const values = revenueEntries.map(([_, value]) => value);

        return {
            labels: labels,
            datasets: [
                {
                    label: 'Doanh Thu Tháng Hiện Tại',
                    data: values,
                    backgroundColor: colors.backgroundColor.slice(0, labels.length),
                    borderColor: colors.borderColor.slice(0, labels.length),
                    borderWidth: 1,
                },
            ],
        };
    }, [stats.financials.revenueByType]);

    // Prepare data for counts comparison chart
    const countsComparisonData = useMemo(() => ({
        labels: ['Hộ Gia Đình', 'Cư Dân', 'Tạm Trú', 'Tạm Vắng'],
        datasets: [
            {
                label: 'Số Lượng',
                data: [
                    stats.counts.households,
                    stats.counts.residents,
                    stats.counts.temporaryResidences,
                    stats.counts.temporaryAbsences
                ],
                backgroundColor: [
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(255, 99, 132, 0.6)'
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(255, 99, 132, 1)'
                ],
                borderWidth: 1,
            },
        ],
    }), [stats.counts]);

    // Prepare data for monthly trend chart
    const monthlyTrendData = useMemo(() => ({
        labels: stats.financials.monthlyTrend.labels,
        datasets: [
            {
                label: 'Doanh Thu Hàng Tháng',
                data: stats.financials.monthlyTrend.data,
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                tension: 0.3,
            },
        ],
    }), [stats.financials.monthlyTrend]);

    // Chart options
    const pieChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right' as const,
                labels: {
                    boxWidth: 15,
                    padding: 15,
                    font: {
                        size: 12
                    }
                }
            },
            title: {
                display: true,
                text: `Tỷ lệ doanh thu ${stats.financials.displayMonthName || 'tháng hiện tại'} theo loại phí`,
                font: {
                    size: 14,
                    weight: 'bold' as const
                }
            },
            tooltip: {
                callbacks: {
                    label: function (context: any) {
                        const value = context.raw || 0;
                        const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                        const percentage = Math.round((value / total) * 100);
                        return `${value.toLocaleString()} VND (${percentage}%)`;
                    },
                    title: function (context: any) {
                        const fullLabel = context[0].label;
                        const feeTypeName = fullLabel.split(':')[0];
                        return feeTypeName;
                    }
                }
            }
        }
    };

    const barChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            title: {
                display: true,
                text: 'Thống kê số lượng đối tượng quản lý',
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Số lượng'
                }
            }
        }
    };

    const lineChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: true,
                text: 'Doanh thu 6 tháng gần nhất',
            },
            tooltip: {
                callbacks: {
                    label: function (context: any) {
                        const label = context.dataset.label || '';
                        const value = context.raw || 0;
                        return `${label}: ${value.toLocaleString()} VND`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Doanh thu (VND)'
                },
                ticks: {
                    callback: function (value: any) {
                        return value.toLocaleString();
                    }
                }
            }
        }
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-8 w-[200px]" />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-[125px]" />
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600">{error}</p>
            </div>
        );
    }

    if (!mounted) {
        return null;
    }

    return (
        <div className="space-y-4">
            <h1 className="text-3xl font-bold tracking-tight">Bảng Điều Khiển</h1>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Hộ Gia Đình</CardTitle>
                        <Home className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.counts.households}</div>
                        <p className="text-xs text-muted-foreground">
                            Tổng số hộ gia đình
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Cư Dân</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.counts.residents}</div>
                        <p className="text-xs text-muted-foreground">
                            Tổng số cư dân
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Loại Phí</CardTitle>
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.counts.fees}</div>
                        <p className="text-xs text-muted-foreground">
                            Số loại phí quản lý
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tạm Trú</CardTitle>
                        <UserPlus className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.counts.temporaryResidences}</div>
                        <p className="text-xs text-muted-foreground">
                            Số người tạm trú
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tạm Vắng</CardTitle>
                        <UserMinus className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.counts.temporaryAbsences}</div>
                        <p className="text-xs text-muted-foreground">
                            Số người tạm vắng
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Doanh Thu</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.financials.monthlyRevenue.toLocaleString()} VND
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {stats.financials.displayMonthName || "Tháng hiện tại"}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="revenue" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="revenue">Doanh Thu</TabsTrigger>
                    <TabsTrigger value="statistics">Thống Kê</TabsTrigger>
                    <TabsTrigger value="payments">Thanh Toán Gần Đây</TabsTrigger>
                </TabsList>

                <TabsContent value="revenue" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Doanh Thu Theo Loại Phí</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px]">
                                    <Pie data={revenueByTypeData} options={pieChartOptions} />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Xu Hướng Doanh Thu</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px]">
                                    <Line data={monthlyTrendData} options={lineChartOptions} />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="statistics" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Thống Kê Số Lượng</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
                                <Bar data={countsComparisonData} options={barChartOptions} />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="payments" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Thanh Toán Gần Đây</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Hộ Gia Đình</TableHead>
                                        <TableHead>Phí</TableHead>
                                        <TableHead>Số Tiền</TableHead>
                                        <TableHead>Ngày</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {stats.recentPayments.map((payment) => (
                                        <TableRow key={payment._id}>
                                            <TableCell>{payment.household?.apartmentNumber || 'N/A'}</TableCell>
                                            <TableCell>{payment.fee?.name || 'N/A'}</TableCell>
                                            <TableCell>{payment.amount.toLocaleString()} VND</TableCell>
                                            <TableCell>
                                                {new Date(payment.paymentDate).toLocaleDateString('vi-VN')}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default DashboardPage;
