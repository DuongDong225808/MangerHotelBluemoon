'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import axios from 'axios'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Loader2, Grid, List, Eye, Pencil, Trash2, ArrowLeft } from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
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
        fullName: string
    }
    active: boolean
    createdAt: string
    notes?: string
}

export default function HouseholdsPage() {
    const [households, setHouseholds] = useState<Household[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [searchTerm, setSearchTerm] = useState('')
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const router = useRouter()
    const { user, token } = useAuth()

    useEffect(() => {
        if (!user || !token) {
            router.push('/login')
            return
        }
        fetchHouseholds()
    }, [user, token])

    const fetchHouseholds = async () => {
        try {
            setLoading(true)
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }

            const { data } = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/households`, config)
            setHouseholds(data)
            setLoading(false)
        } catch (error: any) {
            setError(
                error.response?.data?.message || 'Không thể tải danh sách hộ gia đình'
            )
            setLoading(false)
        }
    }

    const deleteHandler = async (id: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa hộ gia đình này không?')) {
            try {
                setLoading(true)
                const config = {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }

                await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/households/${id}`, config)
                fetchHouseholds()
            } catch (error: any) {
                setError(
                    error.response?.data?.message || 'Không thể xóa hộ gia đình'
                )
                setLoading(false)
            }
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN')
    }

    const filteredHouseholds = households.filter(
        (household) =>
            household.apartmentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            household.address.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 p-8">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push('/dashboard')}
                            className="hover:bg-gray-100"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                        </Button>
                        <h1 className="text-2xl font-bold text-gray-900">Hộ Gia Đình</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border">
                            <Button
                                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('grid')}
                                className={viewMode === 'grid' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                            >
                                <Grid className="h-4 w-4" />
                            </Button>
                            <Button
                                variant={viewMode === 'list' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('list')}
                                className={viewMode === 'list' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                            >
                                <List className="h-4 w-4" />
                            </Button>
                        </div>
                        <Button
                            onClick={() => router.push('/households/edit')}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            Thêm Hộ Gia Đình
                        </Button>
                    </div>
                </div>

                <div className="mb-6">
                    <Input
                        type="text"
                        placeholder="Tìm kiếm theo số căn hộ hoặc địa chỉ"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="max-w-md"
                    />
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                    </div>
                ) : error ? (
                    <div className="bg-red-50 text-red-500 p-4 rounded-lg mb-6">
                        {error}
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredHouseholds.map((household) => (
                            <Card key={household._id} className="hover:shadow-lg transition-shadow">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                Căn hộ {household.apartmentNumber}
                                            </h3>
                                            <p className="text-sm text-gray-600">{household.address}</p>
                                        </div>
                                        <Badge
                                            className={`${household.active
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                                }`}
                                        >
                                            {household.active ? 'Hoạt động' : 'Không hoạt động'}
                                        </Badge>
                                    </div>

                                    <div className="text-sm text-gray-600 mb-4 space-y-1">
                                        <p>
                                            <span className="font-medium">Chủ hộ:</span>{' '}
                                            {household.householdHead?.fullName || 'Chưa có thông tin'}
                                        </p>
                                        <p>
                                            <span className="font-medium">Ngày tạo:</span>{' '}
                                            {formatDate(household.createdAt)}
                                        </p>
                                    </div>

                                    <div className="flex justify-end space-x-2 border-t pt-4 mt-4">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                router.push(`/households/detail?id=${household._id}`)
                                            }
                                            className="border-blue-500 text-blue-600 hover:bg-blue-50"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        {(user?.role === 'admin' || user?.role === 'accountant') && (
                                            <>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        router.push(`/households/edit?id=${household._id}`)
                                                    }
                                                    className="border-orange-500 text-orange-600 hover:bg-orange-50"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => deleteHandler(household._id)}
                                                    className="border-red-500 text-red-600 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-lg border shadow-sm">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50 hover:bg-gray-50">
                                    <TableHead className="font-semibold text-gray-900">Số căn hộ</TableHead>
                                    <TableHead className="font-semibold text-gray-900">Địa chỉ</TableHead>
                                    <TableHead className="font-semibold text-gray-900">Chủ hộ</TableHead>
                                    <TableHead className="font-semibold text-gray-900">Trạng thái</TableHead>
                                    <TableHead className="font-semibold text-gray-900">Ngày tạo</TableHead>
                                    <TableHead className="font-semibold text-gray-900 text-center">Thao tác</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredHouseholds.map((household) => (
                                    <TableRow key={household._id} className="hover:bg-gray-50">
                                        <TableCell className="font-medium text-gray-900">
                                            {household.apartmentNumber}
                                        </TableCell>
                                        <TableCell className="text-gray-600">{household.address}</TableCell>
                                        <TableCell className="text-gray-600">
                                            {household.householdHead?.fullName || 'Chưa có thông tin'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                className={`${household.active
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                                    } px-2 py-1 rounded-full text-xs font-medium`}
                                            >
                                                {household.active ? 'Hoạt động' : 'Không hoạt động'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-gray-600">{formatDate(household.createdAt)}</TableCell>
                                        <TableCell>
                                            <div className="flex justify-center space-x-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        router.push(`/households/detail?id=${household._id}`)
                                                    }
                                                    className="border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                                                >
                                                    <Eye className="h-4 w-4 mr-1" />
                                                    Chi tiết
                                                </Button>
                                                {(user?.role === 'admin' || user?.role === 'accountant') && (
                                                    <>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                router.push(`/households/edit?id=${household._id}`)
                                                            }
                                                            className="border-orange-500 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                                                        >
                                                            <Pencil className="h-4 w-4 mr-1" />
                                                            Sửa
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => deleteHandler(household._id)}
                                                            className="border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700"
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-1" />
                                                            Xóa
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}

                {!loading && filteredHouseholds.length === 0 && (
                    <div className="text-center text-gray-500 mt-8">
                        Không tìm thấy hộ gia đình nào
                    </div>
                )}
            </div>
        </div>
    )
}