'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { toast } from 'sonner';
import { Badge } from "@/components/ui/badge";
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
    name: string;
}

interface Household {
    _id: string;
    apartmentNumber: string;
}

interface Payment {
    _id: string;
    fee: Fee;
    household: Household;
    amount: number;
    method: 'cash' | 'bank_transfer' | 'card' | 'other';
    status: 'paid' | 'pending' | 'overdue';
    paymentDate: string;
    dueDate?: string;
    collector?: {
        _id: string;
        name: string;
    };
    note?: string;
    receiptNumber?: string;
    payerName?: string;
    createdAt: string;
    updatedAt: string;
}

export default function PaymentDetailPage({ params }: { params: { id: string } }) {
    const [payment, setPayment] = useState<Payment | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const router = useRouter();
    const { user, token } = useAuth();

    useEffect(() => {
        if (!user || !token) {
            router.push('/login');
            return;
        }
        fetchPayment();
    }, [user, token]);

    const fetchPayment = async () => {
        try {
            setLoading(true);
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };

            const { data } = await axios.get(`/api/payments/${params.id}`, config);
            setPayment(data);
            setLoading(false);
        } catch (error: any) {
            setError(
                error.response?.data?.message || 'Không thể tải thông tin thanh toán'
            );
            setLoading(false);
            toast.error('Không thể tải thông tin thanh toán');
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'paid':
                return <Badge className="bg-green-100 text-green-800">Đã thanh toán</Badge>;
            case 'overdue':
                return <Badge className="bg-red-100 text-red-800">Quá hạn</Badge>;
            default:
                return <Badge className="bg-yellow-100 text-yellow-800">Chưa thanh toán</Badge>;
        }
    };

    const getMethodText = (method: string) => {
        switch (method) {
            case 'cash':
                return 'Tiền mặt';
            case 'bank_transfer':
                return 'Chuyển khoản';
            case 'card':
                return 'Thẻ';
            default:
                return 'Khác';
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            <div className="fixed top-0 left-0 h-screen">
                <Sidebar />
            </div>
            <div className="flex-1 ml-64 p-8">
                <div className="flex items-center gap-4 mb-6">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push('/payments')}
                        className="hover:bg-gray-100"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Quay lại
                    </Button>
                    <h1 className="text-2xl font-bold text-gray-900">Chi Tiết Thanh Toán</h1>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                    </div>
                ) : error ? (
                    <div className="bg-red-50 text-red-500 p-4 rounded-lg mb-6">
                        {error}
                    </div>
                ) : payment ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="md:col-span-2">
                            <CardContent className="p-6">
                                <h2 className="text-xl font-semibold mb-4">Thông Tin Cơ Bản</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">ID</p>
                                            <p className="text-sm">{payment._id}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Tên Phí</p>
                                            <p className="text-sm">{payment.fee?.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Căn Hộ</p>
                                            <p className="text-sm">{payment.household?.apartmentNumber}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Số Tiền</p>
                                            <p className="text-sm">
                                                {payment.amount?.toLocaleString('vi-VN', {
                                                    style: 'currency',
                                                    currency: 'VND',
                                                })}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Phương Thức</p>
                                            <p className="text-sm">{getMethodText(payment.method)}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Trạng Thái</p>
                                            <div className="mt-1">{getStatusBadge(payment.status)}</div>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Ngày Thanh Toán</p>
                                            <p className="text-sm">
                                                {payment.paymentDate
                                                    ? new Date(payment.paymentDate).toLocaleDateString('vi-VN')
                                                    : 'N/A'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Ngày Tạo</p>
                                            <p className="text-sm">
                                                {new Date(payment.createdAt).toLocaleDateString('vi-VN')}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Cập Nhật Lần Cuối</p>
                                            <p className="text-sm">
                                                {new Date(payment.updatedAt).toLocaleDateString('vi-VN')}
                                            </p>
                                        </div>
                                        {payment.note && (
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">Ghi Chú</p>
                                                <p className="text-sm">{payment.note}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                    </div>
                ) : (
                    <div className="text-center text-gray-500">
                        Không tìm thấy thông tin thanh toán
                    </div>
                )}
            </div>
        </div>
    );
} 