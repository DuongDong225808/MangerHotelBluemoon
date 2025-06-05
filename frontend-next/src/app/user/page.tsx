'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { fetchApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, Pencil, Trash2, X } from 'lucide-react';
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

    const router = useRouter();
    const { user, token } = useAuth();

    useEffect(() => {
        if (!user || !token || user.role !== 'admin') {
            router.push('/dashboard');
            return;
        }

        fetchUsers();
    }, [user, token]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const data = await fetchApi('/api/users');
            setUsers(data);
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
            await fetchApi(`/api/users/${userToDelete._id}`, {
                method: 'DELETE'
            });

            toast.success('Xóa người dùng thành công');
            fetchUsers();
        } catch (error: any) {
            toast.error(
                error.response?.data?.message || 'Không thể xóa người dùng'
            );
        } finally {
            setDeleteDialogOpen(false);
            setUserToDelete(null);
        }
    };

    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                    <h1 className="text-2xl font-bold text-gray-900">Quản Lý Người Dùng</h1>
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
                                                        <span className={`px-2 py-1 rounded-full text-xs ${user.active
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                            }`}>
                                                            {user.active ? 'Đang hoạt động' : 'Đã vô hiệu hóa'}
                                                        </span>
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
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleDelete(user)}
                                                                className="hover:bg-red-100 text-red-600"
                                                                disabled={user._id === user?._id}
                                                                title="Xóa"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
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

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc chắn muốn xóa người dùng này? Hành động này không thể hoàn tác.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Xóa
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
} 