'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { fetchApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { toast } from 'sonner';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface ValidationErrors {
    username?: string;
    password?: string;
    confirmPassword?: string;
    fullName?: string;
    role?: string;
}

export default function UserEditPage({ params }: { params: { id: string } }) {
    const { id } = params;
    const isEditMode = true;

    // Form fields
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [role, setRole] = useState('accountant');
    const [active, setActive] = useState(true);

    // States
    const [loading, setLoading] = useState(false);
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

    const router = useRouter();
    const { user, token } = useAuth();

    useEffect(() => {
        // Chỉ admin mới được truy cập trang này
        if (!user || !token || user.role !== 'admin') {
            router.push('/dashboard');
            return;
        }

        fetchUserDetails();
    }, [user, token, id]);

    const fetchUserDetails = async () => {
        try {
            setLoading(true);
            const data = await fetchApi(`/api/users/${id}`);

            setUsername(data.username);
            setFullName(data.fullName);
            setEmail(data.email || '');
            setPhone(data.phone || '');
            setRole(data.role);
            setActive(data.active);

            setLoading(false);
        } catch (error: any) {
            toast.error(
                error.response?.data?.message || 'Không thể tải thông tin người dùng'
            );
            setLoading(false);
        }
    };

    const validateForm = () => {
        const errors: ValidationErrors = {};

        if (!username) errors.username = 'Tên đăng nhập là bắt buộc';
        if (password && password.length < 6) {
            errors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
        }
        if (password && password !== confirmPassword) {
            errors.confirmPassword = 'Mật khẩu xác nhận không khớp';
        }
        if (!fullName) errors.fullName = 'Họ tên là bắt buộc';
        if (!role) errors.role = 'Vai trò là bắt buộc';

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const submitHandler = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            setLoading(true);

            const userData: {
                username: string;
                fullName: string;
                role: string;
                email: string;
                phone: string;
                active: boolean;
                password?: string;
            } = {
                username,
                fullName,
                role,
                email,
                phone,
                active
            };

            // Chỉ thêm mật khẩu nếu người dùng nhập vào
            if (password) {
                userData.password = password;
            }

            await fetchApi(`/api/users/${id}`, {
                method: 'PUT',
                body: JSON.stringify(userData)
            });

            toast.success('Cập nhật người dùng thành công');

            setTimeout(() => {
                router.push('/user');
            }, 1500);
        } catch (error: any) {
            toast.error(
                error.response?.data?.message || 'Không thể cập nhật người dùng'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 p-8">
                <div className="flex items-center gap-4 mb-6">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push('/user')}
                        className="hover:bg-gray-100"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Quay lại Danh sách người dùng
                    </Button>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Chỉnh Sửa Người Dùng
                    </h1>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Thông tin người dùng</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submitHandler} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="username">Tên đăng nhập</Label>
                                <Input
                                    id="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    disabled={true}
                                    className="bg-gray-100"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="password">
                                        Mật khẩu mới (để trống nếu không đổi)
                                    </Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className={validationErrors.password ? "border-red-500" : ""}
                                    />
                                    {validationErrors.password && (
                                        <p className="text-sm text-red-500">{validationErrors.password}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className={validationErrors.confirmPassword ? "border-red-500" : ""}
                                    />
                                    {validationErrors.confirmPassword && (
                                        <p className="text-sm text-red-500">{validationErrors.confirmPassword}</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="fullName">Họ và Tên</Label>
                                <Input
                                    id="fullName"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className={validationErrors.fullName ? "border-red-500" : ""}
                                />
                                {validationErrors.fullName && (
                                    <p className="text-sm text-red-500">{validationErrors.fullName}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="role">Vai trò</Label>
                                <Select
                                    value={role}
                                    onValueChange={setRole}
                                >
                                    <SelectTrigger className={validationErrors.role ? "border-red-500" : ""}>
                                        <SelectValue placeholder="Chọn vai trò" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="accountant">Kế toán</SelectItem>
                                        <SelectItem value="manager">Quản lý</SelectItem>
                                        <SelectItem value="admin">Quản trị viên</SelectItem>
                                    </SelectContent>
                                </Select>
                                {validationErrors.role && (
                                    <p className="text-sm text-red-500">{validationErrors.role}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">Số điện thoại</Label>
                                <Input
                                    id="phone"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                />
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="active"
                                    checked={active}
                                    onCheckedChange={(checked) => setActive(checked as boolean)}
                                />
                                <Label htmlFor="active">Đang hoạt động</Label>
                            </div>

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
                                        'Cập Nhật'
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