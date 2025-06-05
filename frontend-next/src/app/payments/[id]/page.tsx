'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Header } from '@/components/Header';
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
                return <Badge className="bg-green-500">Đã thanh toán</Badge>;
            case 'overdue':
                return <Badge className="bg-red-500">Quá hạn</Badge>;
            default:
                return <Badge className="bg-yellow-500">Chưa thanh toán</Badge>;
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
        <div className="min-h-screen bg-gray-50">
            <Header />
            <div className="container mx-auto px-4 py-8">
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
                                <Table>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell className="font-medium">ID</TableCell>
                                            <TableCell>{payment._id}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="font-medium">Tên Phí</TableCell>
                                            <TableCell>{payment.fee?.name}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="font-medium">Căn Hộ</TableCell>
                                            <TableCell>{payment.household?.apartmentNumber}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="font-medium">Số Tiền</TableCell>
                                            <TableCell>
                                                {payment.amount?.toLocaleString('vi-VN', {
                                                    style: 'currency',
                                                    currency: 'VND',
                                                })}
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="font-medium">Phương Thức</TableCell>
                                            <TableCell>{getMethodText(payment.method)}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="font-medium">Trạng Thái</TableCell>
                                            <TableCell>{getStatusBadge(payment.status)}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="font-medium">Ngày Thanh Toán</TableCell>
                                            <TableCell>
                                                {payment.paymentDate
                                                    ? new Date(payment.paymentDate).toLocaleDateString('vi-VN')
                                                    : 'N/A'}
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="font-medium">Ngày Tạo</TableCell>
                                            <TableCell>
                                                {new Date(payment.createdAt).toLocaleDateString('vi-VN')}
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="font-medium">Cập Nhật Lần Cuối</TableCell>
                                            <TableCell>
                                                {new Date(payment.updatedAt).toLocaleDateString('vi-VN')}
                                            </TableCell>
                                        </TableRow>
                                        {payment.note && (
                                            <TableRow>
                                                <TableCell className="font-medium">Ghi Chú</TableCell>
                                                <TableCell>{payment.note}</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <h2 className="text-xl font-semibold mb-4">Thông Tin Bổ Sung</h2>
                                <Table>
                                    <TableBody>
                                        {payment.dueDate && (
                                            <TableRow>
                                                <TableCell className="font-medium">Hạn Thanh Toán</TableCell>
                                                <TableCell>
                                                    {new Date(payment.dueDate).toLocaleDateString('vi-VN')}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                        {payment.collector && (
                                            <TableRow>
                                                <TableCell className="font-medium">Người Thu</TableCell>
                                                <TableCell>{payment.collector.name}</TableCell>
                                            </TableRow>
                                        )}
                                        {payment.receiptNumber && (
                                            <TableRow>
                                                <TableCell className="font-medium">Số Biên Lai</TableCell>
                                                <TableCell>{payment.receiptNumber}</TableCell>
                                            </TableRow>
                                        )}
                                        {payment.payerName && (
                                            <TableRow>
                                                <TableCell className="font-medium">Người Thanh Toán</TableCell>
                                                <TableCell>{payment.payerName}</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
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