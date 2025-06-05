'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, ArrowLeft, Plus, Pencil, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { toast } from 'sonner';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface Fee {
    _id: string;
    feeCode: string;
    name: string;
    feeType: string;
    amount: number;
    startDate: string;
    endDate: string;
    active: boolean;
}

export default function FeesPage() {
    const searchParams = useSearchParams();
    const message = searchParams.get('message');
    const [fees, setFees] = useState<Fee[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const router = useRouter();
    const { user, token } = useAuth();

    useEffect(() => {
        if (!user || !token) {
            router.push('/login');
            return;
        }
        fetchFees();
    }, [user, token]);

    useEffect(() => {
        if (message === 'update_success') {
            toast.success('Cập nhật phí thành công', {
                description: 'Thông tin phí đã được cập nhật',
                duration: 3000,
            });
            // Xóa message parameter khỏi URL
            router.replace('/fees');
        } else if (message === 'create_success') {
            toast.success('Tạo phí mới thành công', {
                description: 'Phí mới đã được thêm vào hệ thống',
                duration: 3000,
            });
            // Xóa message parameter khỏi URL
            router.replace('/fees');
        }
    }, [message]);

    const fetchFees = async () => {
        try {
            setLoading(true);
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };

            const { data } = await axios.get('/api/fees', config);
            setFees(data);
            setLoading(false);
        } catch (error: any) {
            setError(
                error.response?.data?.message || 'Không thể tải danh sách phí'
            );
            setLoading(false);
        }
    };

    const deleteFeeHandler = async (id: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa khoản phí này không?')) {
            try {
                setLoading(true);
                const config = {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                };

                await axios.delete(`/api/fees/${id}`, config);
                toast.success('Xóa phí thành công');
                fetchFees();
            } catch (error: any) {
                toast.error(
                    error.response?.data?.message || 'Không thể xóa khoản phí'
                );
                setLoading(false);
            }
        }
    };

    const translateFeeType = (feeType: string) => {
        const translations: { [key: string]: string } = {
            'mandatory': 'Bắt buộc',
            'service': 'Dịch vụ',
            'maintenance': 'Bảo trì',
            'voluntary': 'Tự nguyện',
            'contribution': 'Đóng góp',
            'parking': 'Đỗ xe',
            'utilities': 'Tiện ích'
        };

        return translations[feeType] || feeType;
    };

    const filteredFees = fees.filter(
        (fee) =>
            fee.feeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
            fee.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex min-h-screen bg-gray-50">
            <div className="fixed top-0 left-0 h-screen">
                <Sidebar />
            </div>
            <div className="flex-1 ml-64 p-8">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push('/dashboard')}
                            className="hover:bg-gray-100"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Quay lại Dashboard
                        </Button>
                        <h1 className="text-2xl font-bold text-gray-900">Danh Sách Phí</h1>
                    </div>
                    <Button
                        onClick={() => router.push('/fees/edit')}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Thêm Phí Mới
                    </Button>
                </div>

                <div className="mb-6">
                    <Input
                        type="text"
                        placeholder="Tìm kiếm theo mã phí hoặc tên"
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
                ) : (
                    <Card>
                        <CardContent className="p-6">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Mã Phí</TableHead>
                                        <TableHead>Tên</TableHead>
                                        <TableHead>Loại</TableHead>
                                        <TableHead>Số Tiền</TableHead>
                                        <TableHead>Ngày Bắt Đầu</TableHead>
                                        <TableHead>Ngày Kết Thúc</TableHead>
                                        <TableHead>Trạng Thái</TableHead>
                                        <TableHead className="text-center">Thao Tác</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredFees.map((fee) => (
                                        <TableRow key={fee._id}>
                                            <TableCell className="font-medium">
                                                {fee.feeCode}
                                            </TableCell>
                                            <TableCell>{fee.name}</TableCell>
                                            <TableCell>{translateFeeType(fee.feeType)}</TableCell>
                                            <TableCell>{fee.amount.toLocaleString()} VND</TableCell>
                                            <TableCell>
                                                {fee.startDate
                                                    ? new Date(fee.startDate).toLocaleDateString('vi-VN')
                                                    : 'N/A'}
                                            </TableCell>
                                            <TableCell>
                                                {fee.endDate
                                                    ? new Date(fee.endDate).toLocaleDateString('vi-VN')
                                                    : 'N/A'}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {fee.active ? (
                                                        <>
                                                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                            <span className="text-green-600">Đang kích hoạt</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <XCircle className="h-4 w-4 text-red-600" />
                                                            <span className="text-red-600">Vô hiệu hóa</span>
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex justify-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            router.push(`/fees/edit?id=${fee._id}`)
                                                        }
                                                        className="hover:bg-yellow-50"
                                                    >
                                                        <Pencil className="h-4 w-4 text-yellow-600" />
                                                    </Button>
                                                    {user?.role === 'admin' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => deleteFeeHandler(fee._id)}
                                                            className="hover:bg-red-50"
                                                        >
                                                            <Trash2 className="h-4 w-4 text-red-600" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            {filteredFees.length === 0 && (
                                <div className="text-center text-gray-500 mt-8">
                                    Không tìm thấy khoản phí nào
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
} 