'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Header } from '@/components/Header';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface ValidationErrors {
    feeCode?: string;
    name?: string;
    amount?: string;
    startDate?: string;
    endDate?: string;
}

export default function FeeEditPage() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const isEditMode = !!id;

    const [feeCode, setFeeCode] = useState('');
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [feeType, setFeeType] = useState('mandatory');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [active, setActive] = useState(true);

    const [loading, setLoading] = useState(false);
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

    const router = useRouter();
    const { user, token } = useAuth();

    useEffect(() => {
        if (!user || !token) {
            router.push('/login');
            return;
        }
        if (isEditMode) {
            fetchFeeDetails();
        }
    }, [user, token, id]);

    const fetchFeeDetails = async () => {
        try {
            setLoading(true);
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };

            const { data } = await axios.get(`/api/fees/${id}`, config);

            setFeeCode(data.feeCode);
            setName(data.name);
            setAmount(data.amount?.toString() || '');
            setFeeType(data.feeType || 'mandatory');
            setDescription(data.description || '');

            if (data.startDate) {
                const startDateObj = new Date(data.startDate);
                setStartDate(startDateObj.toISOString().split('T')[0]);
            }

            if (data.endDate) {
                const endDateObj = new Date(data.endDate);
                setEndDate(endDateObj.toISOString().split('T')[0]);
            }

            setActive(data.active);
            setLoading(false);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Không thể tải thông tin phí');
            setLoading(false);
        }
    };

    const validateForm = () => {
        const errors: ValidationErrors = {};

        if (!feeCode.trim()) {
            errors.feeCode = 'Mã phí là bắt buộc';
        }

        if (!name.trim()) {
            errors.name = 'Tên phí là bắt buộc';
        }

        if (!amount || parseFloat(amount) <= 0) {
            errors.amount = 'Số tiền phải lớn hơn 0';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const submitHandler = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            setLoading(true);

            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            };

            const feeData = {
                feeCode: feeCode.trim(),
                name: name.trim(),
                amount: parseFloat(amount),
                feeType,
                description: description.trim() || '',
                startDate: startDate || null,
                endDate: endDate || null,
                active: isEditMode ? active : true
            };

            console.log('Sending data:', feeData);

            if (isEditMode) {
                await axios.put(`/api/fees/${id}`, feeData, config);
                toast.success('Cập nhật phí thành công');
                router.push('/fees?message=update_success');
            } else {
                await axios.post('/api/fees', feeData, config);
                toast.success('Tạo phí mới thành công');
                router.push('/fees?message=create_success');
            }
        } catch (error: any) {
            console.error('Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });

            const errorMessage = error.response?.data?.message ||
                `Không thể ${isEditMode ? 'cập nhật' : 'tạo'} phí`;

            toast.error(errorMessage, {
                description: 'Vui lòng kiểm tra lại thông tin và thử lại',
                duration: 5000,
            });
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
                        onClick={() => router.push('/fees')}
                        className="hover:bg-gray-100"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Quay lại Danh Sách Phí
                    </Button>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {isEditMode ? 'Chỉnh Sửa Phí' : 'Tạo Phí Mới'}
                    </h1>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Thông Tin Phí</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submitHandler} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="feeCode">Mã Phí</Label>
                                    <Input
                                        id="feeCode"
                                        value={feeCode}
                                        onChange={(e) => setFeeCode(e.target.value)}
                                        placeholder="Nhập mã phí"
                                        className={validationErrors.feeCode ? "border-red-500" : ""}
                                    />
                                    {validationErrors.feeCode && (
                                        <p className="text-sm text-red-500">{validationErrors.feeCode}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="name">Tên Phí</Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Nhập tên phí"
                                        className={validationErrors.name ? "border-red-500" : ""}
                                    />
                                    {validationErrors.name && (
                                        <p className="text-sm text-red-500">{validationErrors.name}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="amount">Số Tiền</Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="Nhập số tiền"
                                        min="0"
                                        step="0.01"
                                        className={validationErrors.amount ? "border-red-500" : ""}
                                    />
                                    {validationErrors.amount && (
                                        <p className="text-sm text-red-500">{validationErrors.amount}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="feeType">Loại Phí</Label>
                                    <Select value={feeType} onValueChange={setFeeType}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Chọn loại phí" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="mandatory">Bắt buộc</SelectItem>
                                            <SelectItem value="voluntary">Tự nguyện</SelectItem>
                                            <SelectItem value="contribution">Đóng góp</SelectItem>
                                            <SelectItem value="parking">Đỗ xe</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="startDate">Ngày Bắt Đầu</Label>
                                    <Input
                                        id="startDate"
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="endDate">Ngày Kết Thúc</Label>
                                    <Input
                                        id="endDate"
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Mô Tả</Label>
                                <Textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Nhập mô tả (không bắt buộc)"
                                    rows={3}
                                />
                            </div>

                            {isEditMode && (
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="active"
                                        checked={active}
                                        onCheckedChange={(checked) => setActive(checked as boolean)}
                                    />
                                    <Label htmlFor="active">Hoạt động</Label>
                                </div>
                            )}

                            <div className="flex justify-end">
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Đang xử lý...
                                        </>
                                    ) : (
                                        isEditMode ? 'Cập Nhật' : 'Tạo Mới'
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