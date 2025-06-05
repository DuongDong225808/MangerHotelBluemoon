'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import axios from 'axios'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, ArrowLeft, Users, CreditCard, Plus, Eye } from 'lucide-react'
import { Header } from '@/components/Header'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

interface Household {
    _id: string
    apartmentNumber: string
    address: string
    householdHead?: {
        _id: string
        fullName: string
    }
    active: boolean
    createdAt: string
    notes?: string
}

interface Resident {
    _id: string
    fullName: string
    dateOfBirth: string
    gender: string
    relationship: string
    phoneNumber?: string
    active: boolean
    idCard?: string
}

interface FeeStatus {
    feeId: string
    feeName: string
    feeType: string
    amount: number
    dueDate: string
    status: 'paid' | 'pending' | 'overdue'
    paymentDate?: string
    lastMonthStatus?: 'paid' | 'pending' | 'overdue'
}

export default function HouseholdDetailPage() {
    const [household, setHousehold] = useState<Household | null>(null)
    const [residents, setResidents] = useState<Resident[]>([])
    const [feeStatus, setFeeStatus] = useState<FeeStatus[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const router = useRouter()
    const searchParams = useSearchParams()
    const householdId = searchParams.get('id')
    const { user, token } = useAuth()

    useEffect(() => {
        if (!user || !token) {
            router.push('/login')
            return
        }
        if (!householdId) {
            router.push('/households')
            return
        }
        fetchHouseholdData()
    }, [user, token, householdId])

    const fetchHouseholdData = async () => {
        try {
            setLoading(true)
            setError('')

            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }            // Make all requests in parallel
            const [householdResponse, residentsResponse, feeStatusResponse] = await Promise.all([
                axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/households/${householdId}`, config),
                axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/households/${householdId}/residents`, config),
                axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/household/${householdId}/fee-status`, config)
            ])

            setHousehold(householdResponse.data)
            setResidents(residentsResponse.data)
            setFeeStatus(feeStatusResponse.data.feeStatus)

        } catch (error: any) {
            setError(
                error.response?.data?.message || 'Không thể tải dữ liệu hộ gia đình'
            )
        } finally {
            setLoading(false)
        }
    }

    const handleAddResident = () => {
        router.push(`/residents/edit?household=${household?._id}`)
    }

    const handleCreatePayment = (feeId: string) => {
        router.push(`/payments/create?household=${household?._id}&fee=${feeId}`)
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'paid':
                return <Badge className="bg-green-100 text-green-800">Đã thanh toán</Badge>
            case 'pending':
                return <Badge className="bg-yellow-100 text-yellow-800">Chưa thanh toán</Badge>
            case 'overdue':
                return <Badge className="bg-red-100 text-red-800">Quá hạn</Badge>
            default:
                return <Badge className="bg-gray-100 text-gray-800">Không áp dụng</Badge>
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN')
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="container mx-auto px-4 py-8">
                    <div className="bg-red-50 text-red-500 p-4 rounded-lg">
                        {error}
                    </div>
                </div>
            </div>
        )
    }

    if (!household) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center text-gray-500">
                        Không tìm thấy thông tin hộ gia đình
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center gap-4 mb-6">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push('/households')}
                        className="hover:bg-gray-100"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Quay lại Danh sách Hộ dân
                    </Button>
                    <h1 className="text-2xl font-bold text-gray-900">Chi tiết Hộ gia đình</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Household Information */}
                    <div className="lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    Thông tin Hộ gia đình
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Số căn hộ</p>
                                    <p className="text-lg font-semibold">{household.apartmentNumber}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Địa chỉ</p>
                                    <p className="text-sm">{household.address}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Chủ hộ</p>
                                    <p className="text-sm">{household.householdHead?.fullName || 'Chưa có thông tin'}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Trạng thái</p>
                                    <Badge className={household.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                        {household.active ? 'Hoạt động' : 'Không hoạt động'}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Ngày tạo</p>
                                    <p className="text-sm">{formatDate(household.createdAt)}</p>
                                </div>
                                {household.notes && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Ghi chú</p>
                                        <p className="text-sm">{household.notes}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Residents and Fees */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Fee Status Section */}
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <CardTitle className="flex items-center gap-2">
                                        <CreditCard className="h-5 w-5" />
                                        Trạng thái Thanh toán ({feeStatus.length})
                                    </CardTitle>
                                    <Button
                                        onClick={() => router.push(`/payments?household=${household._id}`)}
                                        size="sm"
                                        variant="outline"
                                        className="border-blue-500 text-blue-600 hover:bg-blue-50"
                                    >
                                        <CreditCard className="h-4 w-4 mr-2" />
                                        Lịch sử thanh toán
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {feeStatus.length > 0 ? (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Loại phí</TableHead>
                                                <TableHead>Số tiền</TableHead>
                                                <TableHead>Tháng hiện tại</TableHead>
                                                <TableHead>Tháng trước</TableHead>
                                                <TableHead>Thao tác</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {feeStatus.map((fee) => (
                                                <TableRow key={fee.feeId}>
                                                    <TableCell className="font-medium">{fee.feeName}</TableCell>
                                                    <TableCell>{formatCurrency(fee.amount)}</TableCell>
                                                    <TableCell>{getStatusBadge(fee.status)}</TableCell>
                                                    <TableCell>
                                                        {fee.lastMonthStatus && getStatusBadge(fee.lastMonthStatus)}
                                                        {fee.lastMonthStatus === 'overdue' && (
                                                            <span className="ml-2 text-red-500">
                                                                <i className="fas fa-exclamation-triangle"></i>
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {fee.status === 'pending' && (
                                                            <Button
                                                                onClick={() => handleCreatePayment(fee.feeId)}
                                                                size="sm"
                                                                variant="outline"
                                                                className="border-green-500 text-green-600 hover:bg-green-50"
                                                            >
                                                                <CreditCard className="h-4 w-4 mr-2" />
                                                                Thanh toán
                                                            </Button>
                                                        )}
                                                        {fee.lastMonthStatus === 'overdue' && fee.status === 'paid' && (
                                                            <Button
                                                                onClick={() => handleCreatePayment(fee.feeId)}
                                                                size="sm"
                                                                variant="outline"
                                                                className="border-yellow-500 text-yellow-600 hover:bg-yellow-50"
                                                            >
                                                                <CreditCard className="h-4 w-4 mr-2" />
                                                                Thanh toán nợ
                                                            </Button>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <div className="text-center text-gray-500 py-8">
                                        Không có khoản phí nào được áp dụng cho hộ gia đình này
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Residents Section */}
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <CardTitle className="flex items-center gap-2">
                                        <Users className="h-5 w-5" />
                                        Thành viên ({residents.length})
                                    </CardTitle>
                                    <Button
                                        onClick={handleAddResident}
                                        size="sm"
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Thêm thành viên
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {residents.length > 0 ? (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Họ tên</TableHead>
                                                <TableHead>CCCD/CMND</TableHead>
                                                <TableHead>Ngày sinh</TableHead>
                                                <TableHead>Giới tính</TableHead>
                                                <TableHead>Quan hệ</TableHead>
                                                <TableHead>Trạng thái</TableHead>
                                                <TableHead>Thao tác</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {residents.map((resident) => (
                                                <TableRow key={resident._id}>
                                                    <TableCell className="font-medium">
                                                        {resident._id === household.householdHead?._id && (
                                                            <span className="text-green-500 mr-2">✓</span>
                                                        )}
                                                        {resident.fullName}
                                                    </TableCell>
                                                    <TableCell>{resident.idCard || 'N/A'}</TableCell>
                                                    <TableCell>{formatDate(resident.dateOfBirth)}</TableCell>
                                                    <TableCell>{resident.gender === 'male' ? 'Nam' : 'Nữ'}</TableCell>
                                                    <TableCell>{resident.relationship}</TableCell>
                                                    <TableCell>
                                                        <Badge className={resident.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                                            {resident.active ? 'Hoạt động' : 'Không hoạt động'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => router.push(`/residents/${resident._id}`)}
                                                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <div className="text-center text-gray-500 py-8">
                                        Chưa có thành viên nào. Hãy thêm thành viên để bắt đầu.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
