'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Header } from '@/components/Header';
import { toast } from 'sonner';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface Fee {
    _id: string;
    name: string;
    amount: number;
    active: boolean;
}

interface Household {
    _id: string;
    apartmentNumber: string;
}

interface Resident {
    _id: string;
    fullName: string;
    idCard: string;
    phone: string;
    isHouseholdHead: boolean;
}

export default function PaymentCreatePage() {
    const searchParams = useSearchParams();
    const householdParam = searchParams.get('household');
    const feeParam = searchParams.get('fee');

    const [households, setHouseholds] = useState<Household[]>([]);
    const [fees, setFees] = useState<Fee[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Form fields
    const [householdId, setHouseholdId] = useState(householdParam || '');
    const [feeId, setFeeId] = useState(feeParam || '');
    const [amount, setAmount] = useState('');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [payerName, setPayerName] = useState('');
    const [payerId, setPayerId] = useState('');
    const [payerPhone, setPayerPhone] = useState('');
    const [receiptNumber, setReceiptNumber] = useState('');
    const [note, setNote] = useState('');

    const router = useRouter();
    const { user, token } = useAuth();

    const fetchHouseholdHead = useCallback(async () => {
        try {
            if (!householdId || !token) return;

            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };

            const { data } = await axios.get(`/api/households/${householdId}/residents`, config);
            const householdHead = data.find((resident: Resident) => resident.isHouseholdHead) || data[0];

            if (householdHead) {
                setPayerName(householdHead.fullName || '');
                setPayerId(householdHead.idCard || '');
                setPayerPhone(householdHead.phone || '');
            }
        } catch (error) {
            console.error('Lỗi khi tải thông tin chủ hộ:', error);
        }
    }, [householdId, token]);

    const fetchHouseholds = useCallback(async () => {
        try {
            if (!token) return;

            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };

            const { data } = await axios.get('/api/households', config);
            setHouseholds(data);
        } catch (error) {
            console.error('Lỗi khi tải danh sách hộ gia đình:', error);
        }
    }, [token]);

    const fetchFees = useCallback(async () => {
        try {
            if (!token) return;

            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };

            const { data } = await axios.get('/api/fees', config);
            setFees(data.filter((fee: Fee) => fee.active));
        } catch (error) {
            console.error('Lỗi khi tải danh sách phí:', error);
        }
    }, [token]);

    useEffect(() => {
        if (!user || !token) {
            router.push('/login');
            return;
        }
        fetchHouseholds();
        fetchFees();
    }, [user, token, fetchHouseholds, fetchFees]);

    useEffect(() => {
        if (feeId) {
            const fee = fees.find(f => f._id === feeId);
            if (fee) {
                setAmount(fee.amount.toString());
            }
        }
    }, [feeId, fees]);

    useEffect(() => {
        if (householdId) {
            fetchHouseholdHead();
        }
    }, [householdId, fetchHouseholdHead]);

    useEffect(() => {
        const generateReceiptNumber = () => {
            const date = new Date();
            const year = date.getFullYear().toString().substr(-2);
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            return `PM${year}${month}${day}${random}`;
        };
        setReceiptNumber(generateReceiptNumber());
    }, []);

    const validateForm = () => {
        if (!householdId) {
            toast.error('Vui lòng chọn hộ gia đình');
            return false;
        }
        if (!feeId) {
            toast.error('Vui lòng chọn loại phí');
            return false;
        }
        if (!amount || parseFloat(amount) <= 0) {
            toast.error('Số tiền phải lớn hơn 0');
            return false;
        }
        if (!paymentDate) {
            toast.error('Vui lòng chọn ngày thanh toán');
            return false;
        }
        return true;
    };

    const submitHandler = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            setLoading(true);
            setError('');

            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            };

            const paymentData = {
                household: householdId,
                fee: feeId,
                amount: parseFloat(amount),
                paymentDate,
                payerName,
                payerId,
                payerPhone,
                receiptNumber,
                note
            };

            await axios.post('/api/payments', paymentData, config);
            toast.success('Tạo thanh toán thành công');
            router.push('/payments');
        } catch (error: any) {
            setError(
                error.response?.data?.message || 'Không thể tạo thanh toán'
            );
            toast.error('Không thể tạo thanh toán');
        } finally {
            setLoading(false);
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
                    <h1 className="text-2xl font-bold text-gray-900">Tạo Thanh Toán Mới</h1>
                </div>

                <Card>
                    <CardContent className="p-6">
                        <form onSubmit={submitHandler} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="household">Hộ Gia Đình</Label>
                                    <Select
                                        value={householdId}
                                        onValueChange={setHouseholdId}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Chọn Hộ Gia Đình" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {households.map((household) => (
                                                <SelectItem key={household._id} value={household._id}>
                                                    {household.apartmentNumber}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="fee">Loại Phí</Label>
                                    <Select
                                        value={feeId}
                                        onValueChange={setFeeId}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Chọn Loại Phí" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {fees.map((fee) => (
                                                <SelectItem key={fee._id} value={fee._id}>
                                                    {fee.name} ({fee.amount.toLocaleString()} VND)
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="amount">Số Tiền</Label>
                                    <Input
                                        type="number"
                                        id="amount"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        min="0"
                                        step="0.01"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="paymentDate">Ngày Thanh Toán</Label>
                                    <Input
                                        type="date"
                                        id="paymentDate"
                                        value={paymentDate}
                                        onChange={(e) => setPaymentDate(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="payerName">Tên Người Thanh Toán</Label>
                                    <Input
                                        type="text"
                                        id="payerName"
                                        value={payerName}
                                        onChange={(e) => setPayerName(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="payerPhone">Số Điện Thoại</Label>
                                    <Input
                                        type="text"
                                        id="payerPhone"
                                        value={payerPhone}
                                        onChange={(e) => setPayerPhone(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="payerId">CMND/CCCD</Label>
                                    <Input
                                        type="text"
                                        id="payerId"
                                        value={payerId}
                                        onChange={(e) => setPayerId(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="receiptNumber">Mã Biên Lai</Label>
                                    <Input
                                        type="text"
                                        id="receiptNumber"
                                        value={receiptNumber}
                                        onChange={(e) => setReceiptNumber(e.target.value)}
                                    />
                                    <p className="text-sm text-gray-500">
                                        Tự động tạo, nhưng có thể thay đổi
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="note">Ghi Chú</Label>
                                <Textarea
                                    id="note"
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="Nhập ghi chú (không bắt buộc)"
                                    rows={3}
                                />
                            </div>

                            <div className="flex justify-end">
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Đang xử lý...
                                        </>
                                    ) : (
                                        'Tạo Thanh Toán'
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
} 