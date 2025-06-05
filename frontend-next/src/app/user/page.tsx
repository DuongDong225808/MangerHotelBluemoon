'use client';

import { Sidebar } from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useAuth } from '@/context/AuthContext';
import { fetchApi } from '@/lib/api';
import { Loader2, Pencil, Plus, Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface User {
    _id: string;
    username: string;
    fullName: string;
    role: string;
    email: string;
    phone: string;
    active: boolean;
}

export default function UserListPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

    const router = useRouter();
    const { user, token } = useAuth();

    useEffect(() => {
        if (!user || !token || user.role !== 'admin') {
            router.push('/dashboard');
            return;
        }

        fetchUsers();
    }, [user, token, router]);

    useEffect(() => {
        const handleRouteChange = () => {
            fetchUsers();
        };

        window.addEventListener('popstate', handleRouteChange);
        return () => {
            window.removeEventListener('popstate', handleRouteChange);
        };
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await fetchApi('/api/users');
            if (response.success) {
                setUsers(response.data);
            } else {
                toast.error(response.message || 'Không thể tải danh sách người dùng');
            }
            setLoading(false);
        } catch (error: any) {
            toast.error(
                error.response?.data?.message || 'Không thể tải danh sách người dùng'
            );
            setLoading(false);
        }
    };

    const handleDelete = async (user: User) => {
        if (user._id === user?._id) {
            toast.error('Không thể xóa tài khoản của chính mình');
            return;
        }
        setUserToDelete(user);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!userToDelete) return;

        try {
            const response = await fetchApi(`/api/users/${userToDelete._id}`, {
                method: 'DELETE'
            });

            if (response.success) {
                toast.success(response.message || 'Xóa người dùng thành công');
                fetchUsers();
            } else {
                toast.error(response.message || 'Không thể xóa người dùng');
            }
        } catch (error: any) {
            toast.error(
                error.response?.data?.message || 'Không thể xóa người dùng'
            );
        } finally {
            setDeleteDialogOpen(false);
            setUserToDelete(null);
        }
    };

    const handleStatusChange = async (userId: string, currentStatus: boolean) => {
        try {
            setUpdatingStatus(userId);
            const response = await fetchApi(`/api/users/${userId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    active: !currentStatus
                })
            });

            if (response.success) {
                toast.success(response.message || 'Cập nhật trạng thái thành công');
                fetchUsers();
            } else {
                toast.error(response.message || 'Không thể cập nhật trạng thái');
            }
        } catch (error: any) {
            toast.error(
                error.response?.data?.message || 'Không thể cập nhật trạng thái'
            );
        } finally {
            setUpdatingStatus(null);
        }
    };

    const filteredUsers = users.filter(user => {
        const searchLower = searchTerm.toLowerCase();
        return (
            user.username?.toLowerCase().includes(searchLower) ||
            user.fullName?.toLowerCase().includes(searchLower) ||
            user.email?.toLowerCase().includes(searchLower) ||
            user.phone?.toLowerCase().includes(searchLower) ||
            user.role?.toLowerCase().includes(searchLower)
        );
    });

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'admin':
                return 'Quản trị viên';
            case 'manager':
                return 'Quản lý';
            case 'accountant':
                return 'Kế toán';
            default:
                return role;
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 p-8">
                <div className="mb-6">
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-gray-900">Quản Lý Người Dùng</h1>
                        <Button
                            onClick={() => router.push('/user/create')}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Thêm Người Dùng
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Danh sách người dùng</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-4">
                            <div className="relative flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                                    <Input
                                        placeholder="Tìm kiếm theo tên, email, số điện thoại, vai trò..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-8"
                                    />
                                </div>
                                {searchTerm && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSearchTerm('')}
                                        className="h-10"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex justify-center items-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                            </div>
                        ) : (
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Mã</TableHead>
                                            <TableHead>Tên đăng nhập</TableHead>
                                            <TableHead>Họ và tên</TableHead>
                                            <TableHead>Vai trò</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Số điện thoại</TableHead>
                                            <TableHead>Trạng thái</TableHead>
                                            <TableHead className="text-right">Thao tác</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredUsers.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                                                    Không tìm thấy người dùng nào
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredUsers.map((user) => (
                                                <TableRow key={user._id}>
                                                    <TableCell className="font-mono text-sm">{user._id}</TableCell>
                                                    <TableCell>{user.username}</TableCell>
                                                    <TableCell>{user.fullName}</TableCell>
                                                    <TableCell>{getRoleLabel(user.role)}</TableCell>
                                                    <TableCell>{user.email || 'Chưa cung cấp'}</TableCell>
                                                    <TableCell>{user.phone || 'Chưa cung cấp'}</TableCell>
                                                    <TableCell>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleStatusChange(user._id, user.active)}
                                                            disabled={updatingStatus === user._id || user._id === user?._id}
                                                            className={`px-2 py-1 rounded-full text-xs ${user.active
                                                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                                                                }`}
                                                        >
                                                            {updatingStatus === user._id ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                user.active ? 'Đang hoạt động' : 'Đã vô hiệu hóa'
                                                            )}
                                                        </Button>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => router.push(`/user/${user._id}/edit`)}
                                                                className="hover:bg-gray-100"
                                                                title="Chỉnh sửa"
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                        
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

        </div>
    );
} 