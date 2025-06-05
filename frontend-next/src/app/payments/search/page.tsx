'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft, Search, X } from 'lucide-react';
import { Header } from '@/components/Header';
import { toast } from 'sonner';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Fee {
    _id: string;
    name: string;
    feeType: string;
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
    payerName?: string;
    note?: string;
}

export default function PaymentSearchPage() {
    const [apartmentNumber, setApartmentNumber] = useState('');
    const [feeName, setFeeName] = useState('');
    const [feeType, setFeeType] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [minAmount, setMinAmount] = useState('');
    const [maxAmount, setMaxAmount] = useState('');
    const [payerName, setPayerName] = useState('');

    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searched, setSearched] = useState(false);

    const router = useRouter();
    const { user, token } = useAuth();

    const searchPayments = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setLoading(true);
            setError('');

            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };

            const params = new URLSearchParams();
            if (apartmentNumber) params.append('apartmentNumber', apartmentNumber);
            if (feeName) params.append('feeName', feeName);
            if (feeType) params.append('feeType', feeType);
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);
            if (minAmount) params.append('minAmount', minAmount);
            if (maxAmount) params.append('maxAmount', maxAmount);
            if (payerName) params.append('payerName', payerName);

            const { data } = await axios.get(`/api/payments/search?${params.toString()}`, config);
            setPayments(data);
            setSearched(true);
            setLoading(false);
        } catch (error: any) {
            setError(
                error.response?.data?.message || 'Lỗi khi tìm kiếm thanh toán'
            );
            setLoading(false);
            toast.error('Lỗi khi tìm kiếm thanh toán');
        }
    };

    const clearForm = () => {
        setApartmentNumber('');
        setFeeName('');
        setFeeType('');
        setStartDate('');
        setEndDate('');
        setMinAmount('');
        setMaxAmount('');
        setPayerName('');
        setSearched(false);
        setPayments([]);
    };

    const translateFeeType = (feeType: string) => {
        const translations: { [key: string]: string } = {
            'service': 'Dịch vụ',
            'maintenance': 'Bảo trì',
            'water': 'Nước',
            'electricity': 'Điện',
            'parking': 'Đỗ xe',
            'internet': 'Internet',
            'security': 'An ninh',
            'cleaning': 'Vệ sinh',
            'contribution': 'Đóng góp',
            'mandatory': 'Bắt buộc',
            'other': 'Khác'
        };
        return translations[feeType] || 'Khác';
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
                    <h1 className="text-2xl font-bold text-gray-900">Tìm Kiếm Thanh Toán</h1>
                </div>

                <Card className="mb-6">
                    <CardContent className="p-6">
                        <form onSubmit={searchPayments} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="apartmentNumber">Số Căn Hộ</Label>
                                    <Input
                                        type="text"
                                        id="apartmentNumber"
                                        placeholder="Nhập số căn hộ"
                                        value={apartmentNumber}
                                        onChange={(e) => setApartmentNumber(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="payerName">Tên Người Nộp</Label>
                                    <Input
                                        type="text"
                                        id="payerName"
                                        placeholder="Nhập tên người nộp"
                                        value={payerName}
                                        onChange={(e) => setPayerName(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="feeName">Tên Phí</Label>
                                    <Input
                                        type="text"
                                        id="feeName"
                                        placeholder="Nhập tên phí"
                                        value={feeName}
                                        onChange={(e) => setFeeName(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="feeType">Loại Phí</Label>
                                    <Select
                                        value={feeType}
                                        onValueChange={setFeeType}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Chọn loại phí" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">Tất cả loại</SelectItem>
                                            <SelectItem value="mandatory">Bắt buộc</SelectItem>
                                            <SelectItem value="service">Dịch vụ</SelectItem>
                                            <SelectItem value="maintenance">Bảo trì</SelectItem>
                                            <SelectItem value="water">Nước</SelectItem>
                                            <SelectItem value="electricity">Điện</SelectItem>
                                            <SelectItem value="parking">Đỗ xe</SelectItem>
                                            <SelectItem value="internet">Internet</SelectItem>
                                            <SelectItem value="security">An ninh</SelectItem>
                                            <SelectItem value="cleaning">Vệ sinh</SelectItem>
                                            <SelectItem value="contribution">Đóng góp</SelectItem>
                                            <SelectItem value="other">Khác</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="startDate">Từ Ngày</Label>
                                    <Input
                                        type="date"
                                        id="startDate"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="endDate">Đến Ngày</Label>
                                    <Input
                                        type="date"
                                        id="endDate"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="minAmount">Số Tiền Tối Thiểu</Label>
                                    <Input
                                        type="number"
                                        id="minAmount"
                                        placeholder="VND"
                                        value={minAmount}
                                        onChange={(e) => setMinAmount(e.target.value)}
                                        min="0"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="maxAmount">Số Tiền Tối Đa</Label>
                                    <Input
                                        type="number"
                                        id="maxAmount"
                                        placeholder="VND"
                                        value={maxAmount}
                                        onChange={(e) => setMaxAmount(e.target.value)}
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-between">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={clearForm}
                                >
                                    <X className="h-4 w-4 mr-2" />
                                    Xóa Bộ Lọc
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Đang tìm kiếm...
                                        </>
                                    ) : (
                                        <>
                                            <Search className="h-4 w-4 mr-2" />
                                            Tìm Kiếm
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                    </div>
                ) : error ? (
                    <div className="bg-red-50 text-red-500 p-4 rounded-lg mb-6">
                        {error}
                    </div>
                ) : searched ? (
                    <>
                        <h2 className="text-xl font-semibold mb-4">Kết Quả Tìm Kiếm</h2>

                        {payments.length === 0 ? (
                            <div className="text-center text-gray-500">
                                Không tìm thấy thanh toán nào phù hợp
                            </div>
                        ) : (
                            <Card>
                                <CardContent className="p-6">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Căn Hộ</TableHead>
                                                <TableHead>Loại Phí</TableHead>
                                                <TableHead>Số Tiền</TableHead>
                                                <TableHead>Ngày Thanh Toán</TableHead>
                                                <TableHead>Trạng Thái</TableHead>
                                                <TableHead>Người Nộp</TableHead>
                                                <TableHead>Ghi Chú</TableHead>
                                                <TableHead className="text-center">Thao Tác</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {payments.map((payment) => (
                                                <TableRow key={payment._id}>
                                                    <TableCell>
                                                        {payment.household?.apartmentNumber || 'N/A'}
                                                    </TableCell>
                                                    <TableCell>
                                                        {payment.fee?.name}
                                                        <br />
                                                        <span className="text-sm text-gray-500">
                                                            {translateFeeType(payment.fee?.feeType)}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        {payment.amount.toLocaleString('vi-VN', {
                                                            style: 'currency',
                                                            currency: 'VND',
                                                        })}
                                                    </TableCell>
                                                    <TableCell>
                                                        {new Date(payment.paymentDate).toLocaleDateString('vi-VN')}
                                                    </TableCell>
                                                    <TableCell>
                                                        {getStatusBadge(payment.status)}
                                                    </TableCell>
                                                    <TableCell>{payment.payerName || 'N/A'}</TableCell>
                                                    <TableCell>{payment.note || '-'}</TableCell>
                                                    <TableCell className="text-center">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => router.push(`/payments/${payment._id}`)}
                                                            className="hover:bg-blue-50"
                                                        >
                                                            <Search className="h-4 w-4 text-blue-600" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        )}
                    </>
                ) : null}
            </div>
        </div>
    );
} 