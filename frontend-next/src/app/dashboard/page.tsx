'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/context/AuthContext'
import { fetchApi } from '@/lib/api'
import { Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
} from 'chart.js'
import { Pie, Bar, Line } from 'react-chartjs-2'
import { useRouter } from 'next/navigation'

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
)

interface Stats {
    counts: {
        households: number
        residents: number
        fees: number
        temporaryResidences: number
        temporaryAbsences: number
    }
    financials: {
        monthlyRevenue: number
        revenueByType: Record<string, number>
        displayMonthName?: string
        monthlyTrend?: {
            labels: string[]
            data: number[]
        }
    }
    recentPayments: Array<{
        _id: string
        household?: {
            apartmentNumber: string
        }
        fee?: {
            name: string
        }
        amount: number
        paymentDate: string
    }>
}

export default function DashboardPage() {
    const { token } = useAuth()
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
            revenueByType: {}
        },
        recentPayments: []
    })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                if (!token) {
                    return
                }

                const data = await fetchApi('/api/statistics/dashboard')
                setStats(data)
            } catch (error: any) {
                setError('Không thể tải dữ liệu tổng quan')
                console.error('Error fetching dashboard data:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchDashboardData()
    }, [token])

    // Generate monthly trend data
    const monthlyTrend = useMemo(() => {
        if (stats.financials.monthlyTrend) {
            return {
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
            }
        }

        const months = ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6']
        const baseValue = stats.financials.monthlyRevenue || 10000000
        const data = months.map((_, index) => {
            const factor = 0.8 + ((index % 3) * 0.15)
            return Math.floor(baseValue * factor)
        })

        return {
            labels: months,
            datasets: [
                {
                    label: 'Doanh Thu Hàng Tháng',
                    data: data,
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.5)',
                    tension: 0.3,
                },
            ],
        }
    }, [stats.financials.monthlyRevenue, stats.financials.monthlyTrend])

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
        }

        const revenueEntries = Object.entries(stats.financials.revenueByType)
            .filter(([_, value]) => value > 0)
            .sort((a, b) => b[1] - a[1])

        const labels = revenueEntries.map(([label, value]) =>
            `${label}: ${value.toLocaleString()} VND`
        )
        const values = revenueEntries.map(([_, value]) => value)

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
        }
    }, [stats.financials.revenueByType])

    // Prepare data for counts comparison chart
    const countsComparisonData = useMemo(() => ({
        labels: ['Hộ Gia Đình', 'Cư Dân'],
        datasets: [
            {
                label: 'Số Lượng',
                data: [
                    stats.counts.households,
                    stats.counts.residents
                ],
                backgroundColor: [
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(75, 192, 192, 0.6)'
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(75, 192, 192, 1)'
                ],
                borderWidth: 1,
            },
        ],
    }), [stats.counts.households, stats.counts.residents])

    // Chart options
    const pieChartOptions = useMemo(() => ({
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
                        const value = context.raw || 0
                        const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
                        const percentage = Math.round((value / total) * 100)
                        return `${value.toLocaleString()} VND (${percentage}%)`
                    },
                    title: function (context: any) {
                        const fullLabel = context[0].label
                        const feeTypeName = fullLabel.split(':')[0]
                        return feeTypeName
                    }
                }
            }
        }
    }), [stats.financials.displayMonthName])

    const barChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            title: {
                display: true,
                text: 'Số lượng đối tượng quản lý',
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
    }

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
                        const label = context.dataset.label || ''
                        const value = context.raw || 0
                        return `${label}: ${value.toLocaleString()} VND`
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
                        return value.toLocaleString()
                    }
                }
            }
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Bảng Điều Khiển Quản Lý</h1>

            {error && (
                <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="bg-blue-600 text-white">
                    <div className="p-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <h5 className="text-lg font-semibold">Hộ Gia Đình</h5>
                                <p className="text-2xl font-bold">{stats.counts.households}</p>
                            </div>
                            <i className="fas fa-home text-2xl"></i>
                        </div>
                        <button
                            onClick={() => router.push('/households')}
                            className="text-white text-sm hover:underline mt-2"
                        >
                            Xem Chi Tiết →
                        </button>
                    </div>
                </Card>

                <Card className="bg-green-600 text-white">
                    <div className="p-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <h5 className="text-lg font-semibold">Cư Dân</h5>
                                <p className="text-2xl font-bold">{stats.counts.residents}</p>
                            </div>
                            <i className="fas fa-users text-2xl"></i>
                        </div>
                        <button
                            onClick={() => router.push('/residents')}
                            className="text-white text-sm hover:underline mt-2"
                        >
                            Xem Chi Tiết →
                        </button>
                    </div>
                </Card>

                <Card className="bg-yellow-600 text-white">
                    <div className="p-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <h5 className="text-lg font-semibold">Loại Phí</h5>
                                <p className="text-2xl font-bold">{stats.counts.fees}</p>
                            </div>
                            <i className="fas fa-file-invoice-dollar text-2xl"></i>
                        </div>
                        <button
                            onClick={() => router.push('/fees')}
                            className="text-white text-sm hover:underline mt-2"
                        >
                            Xem Chi Tiết →
                        </button>
                    </div>
                </Card>

                <Card className="bg-cyan-600 text-white">
                    <div className="p-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <h5 className="text-lg font-semibold">Doanh Thu</h5>
                                <p className="text-2xl font-bold">
                                    {stats.financials.monthlyRevenue.toLocaleString()}
                                </p>
                            </div>
                            <i className="fas fa-dollar-sign text-2xl"></i>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                            <span className="text-sm text-white/80">
                                {stats.financials.displayMonthName || "Tháng hiện tại"}
                            </span>
                            <button
                                onClick={() => router.push('/payments')}
                                className="text-white text-sm hover:underline"
                            >
                                Xem Chi Tiết →
                            </button>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Card>
                    <div className="p-4">
                        <h5 className="text-lg font-semibold mb-2">Tỷ Lệ Doanh Thu</h5>
                        <p className="text-sm text-gray-500 mb-4">
                            {stats.financials.displayMonthName || "Tháng hiện tại"} theo loại phí
                        </p>
                        {Object.keys(stats.financials.revenueByType).length === 0 ? (
                            <p className="text-center">Không có dữ liệu doanh thu tháng này</p>
                        ) : (
                            <div className="h-[300px]">
                                <Pie data={revenueByTypeData} options={pieChartOptions} />
                            </div>
                        )}
                    </div>
                </Card>

                <Card>
                    <div className="p-4">
                        <h5 className="text-lg font-semibold mb-2">Thống Kê Số Lượng</h5>
                        <p className="text-sm text-gray-500 mb-4">Số lượng hộ gia đình và cư dân</p>
                        <div className="h-[300px]">
                            <Bar data={countsComparisonData} options={barChartOptions} />
                        </div>
                    </div>
                </Card>
            </div>

            <Card className="mb-6">
                <div className="p-4">
                    <h5 className="text-lg font-semibold mb-2">Biểu Đồ Doanh Thu</h5>
                    <p className="text-sm text-gray-500 mb-4">6 tháng gần nhất</p>
                    <div className="h-[300px]">
                        <Line data={monthlyTrend} options={lineChartOptions} />
                    </div>
                </div>
            </Card>

            <Card>
                <div className="p-4">
                    <h5 className="text-lg font-semibold mb-4">Phí Đã Thanh Toán Gần Đây</h5>
                    {stats.recentPayments.length === 0 ? (
                        <p className="text-center">Không tìm thấy thanh toán gần đây</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-2">Hộ Gia Đình</th>
                                        <th className="text-left py-2">Phí</th>
                                        <th className="text-left py-2">Số Tiền</th>
                                        <th className="text-left py-2">Ngày</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.recentPayments.map((payment) => (
                                        <tr key={payment._id} className="border-b hover:bg-gray-50">
                                            <td className="py-2">
                                                {payment.household?.apartmentNumber || 'N/A'}
                                            </td>
                                            <td className="py-2">{payment.fee?.name || 'N/A'}</td>
                                            <td className="py-2">{payment.amount.toLocaleString()} VND</td>
                                            <td className="py-2">
                                                {new Date(payment.paymentDate).toLocaleDateString('vi-VN')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    )
}
