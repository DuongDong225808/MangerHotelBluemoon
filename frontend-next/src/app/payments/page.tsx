'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft, Plus, Eye, Search, X } from 'lucide-react';
import { Header } from '@/components/Header';
import { toast } from 'sonner';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

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
}

export default function PaymentPage() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const router = useRouter();
    const { user, token } = useAuth();

    useEffect(() => {
        if (!user || !token) {
            router.push('/login');
            return;
        }
        fetchPayments();
    }, [user, token]);

    const fetchPayments = async () => {
        try {
            setLoading(true);
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };

            const { data } = await axios.get('/api/payments', config);
            setPayments(data);
            setLoading(false);
        } catch (error: any) {
            setError(
                error.response?.data?.message || 'Không thể tải danh sách thanh toán'
            );
            setLoading(false);
            toast.error('Không thể tải danh sách thanh toán');
        }
    };

    const handleRefund = async (id: string) => {
        if (window.confirm('Bạn có chắc chắn muốn hoàn tiền khoản thanh toán này? Hành động này không thể hoàn tác.')) {
            try {
                setLoading(true);
                const config = {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                };

                await axios.put(`/api/payments/${id}/refund`, {}, config);
                toast.success('Hoàn tiền thành công');
                fetchPayments();
            } catch (error: any) {
                toast.error(
                    error.response?.data?.message || 'Không thể hoàn tiền khoản thanh toán'
                );
                setLoading(false);
            }
        }
    };

    const filteredPayments = payments.filter((payment) => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = (
            payment.household?.apartmentNumber?.toLowerCase().includes(searchLower) ||
            payment.fee?.name?.toLowerCase().includes(searchLower) ||
            payment.receiptNumber?.toLowerCase().includes(searchLower) ||
            (payment.payerName && payment.payerName.toLowerCase().includes(searchLower))
        );

        const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

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

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <div className="container mx-auto px-4 py-8">
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
                        <h1 className="text-2xl font-bold text-gray-900">Danh Sách Thanh Toán</h1>
                    </div>
                    <Button
                        onClick={() => router.push('/payments/create')}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Tạo Thanh Toán
                    </Button>
                </div>

                <div className="mb-6 flex gap-4 items-center">
                    <div className="flex-1 max-w-md">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Tìm kiếm thanh toán..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                            {searchTerm && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                                    onClick={() => setSearchTerm('')}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                    <Select
                        value={statusFilter}
                        onValueChange={setStatusFilter}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả trạng thái</SelectItem>
                            <SelectItem value="paid">Đã thanh toán</SelectItem>
                            <SelectItem value="pending">Chưa thanh toán</SelectItem>
                            <SelectItem value="overdue">Quá hạn</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button
                        variant="outline"
                        onClick={() => {
                            setSearchTerm('');
                            setStatusFilter('all');
                        }}
                    >
                        Xóa bộ lọc
                    </Button>
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
                                        <TableHead>Loại Phí</TableHead>
                                        <TableHead>Căn Hộ</TableHead>
                                        <TableHead>Số Tiền</TableHead>
                                        <TableHead>Phương Thức</TableHead>
                                        <TableHead>Trạng Thái</TableHead>
                                        <TableHead>Ngày Thanh Toán</TableHead>
                                        <TableHead>Ghi Chú</TableHead>
                                        <TableHead className="text-center">Thao Tác</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredPayments.map((payment) => (
                                        <TableRow key={payment._id}>
                                            <TableCell className="font-medium">
                                                {payment.fee?.name || 'N/A'}
                                            </TableCell>
                                            <TableCell>
                                                {payment.household?.apartmentNumber || 'N/A'}
                                            </TableCell>
                                            <TableCell>
                                                {payment.amount?.toLocaleString('vi-VN', {
                                                    style: 'currency',
                                                    currency: 'VND',
                                                })}
                                            </TableCell>
                                            <TableCell>
                                                {payment.method === 'cash' ? 'Tiền mặt' :
                                                    payment.method === 'bank_transfer' ? 'Chuyển khoản' :
                                                        payment.method === 'card' ? 'Thẻ' : 'Khác'}
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(payment.status)}
                                            </TableCell>
                                            <TableCell>
                                                {payment.paymentDate
                                                    ? new Date(payment.paymentDate).toLocaleDateString('vi-VN')
                                                    : 'N/A'}
                                            </TableCell>
                                            <TableCell>{payment.note || 'N/A'}</TableCell>
                                            <TableCell className="text-center">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => router.push(`/payments/${payment._id}`)}
                                                    className="hover:bg-blue-50"
                                                >
                                                    <Eye className="h-4 w-4 text-blue-600" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            {filteredPayments.length === 0 && (
                                <div className="text-center text-gray-500 mt-8">
                                    Không tìm thấy khoản thanh toán nào
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
