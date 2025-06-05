'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft, Plus, Pencil, Trash2, Eye, X } from 'lucide-react';
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
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface Household {
    _id: string;
    apartmentNumber: string;
    active: boolean;
}

interface Resident {
    _id: string;
    fullName: string;
    idCard: string;
    dateOfBirth: string;
    gender: 'male' | 'female';
    phone: string;
    household?: {
        _id: string;
        apartmentNumber: string;
    };
    active: boolean;
    idCardDate?: string;
    idCardPlace?: string;
    placeOfBirth?: string;
    nationality?: string;
    ethnicity?: string;
    religion?: string;
    occupation?: string;
    workplace?: string;
    note?: string;
}

export default function ResidentPage() {
    const [residents, setResidents] = useState<Resident[]>([]);
    const [households, setHouseholds] = useState<Household[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editFormData, setEditFormData] = useState<Partial<Resident>>({});
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createFormData, setCreateFormData] = useState<Partial<Resident>>({
        fullName: '',
        gender: undefined,
        dateOfBirth: '',
        idCard: '',
        idCardDate: '',
        idCardPlace: '',
        placeOfBirth: '',
        nationality: 'Việt Nam',
        ethnicity: 'Kinh',
        religion: 'Không',
        occupation: '',
        workplace: '',
        phone: '',
        note: '',
        active: true
    });
    const router = useRouter();
    const { user, token } = useAuth();

    useEffect(() => {
        if (!user || !token) {
            router.push('/login');
            return;
        }
        fetchResidents();
        fetchHouseholds();
    }, [user, token]);

    const fetchResidents = async () => {
        try {
            setLoading(true);
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };

            const { data } = await axios.get('/api/residents', config);
            setResidents(data);
            setLoading(false);
        } catch (error: any) {
            setError(
                error.response?.data?.message || 'Không thể tải danh sách cư dân'
            );
            setLoading(false);
        }
    };

    const fetchHouseholds = async () => {
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };

            const { data } = await axios.get('/api/households', config);
            setHouseholds(data.filter((h: Household) => h.active));
        } catch (error) {
            console.error('Lỗi khi tải danh sách hộ gia đình:', error);
        }
    };

    const deleteHandler = async (id: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa cư dân này không?')) {
            try {
                setLoading(true);
                const config = {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                };

                await axios.delete(`/api/residents/${id}`, config);
                toast.success('Xóa cư dân thành công');
                fetchResidents();
            } catch (error: any) {
                toast.error(
                    error.response?.data?.message || 'Không thể xóa cư dân'
                );
                setLoading(false);
            }
        }
    };

    const handleViewDetails = async (id: string) => {
        try {
            setLoading(true);
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };

            const { data } = await axios.get(`/api/residents/${id}`, config);
            setSelectedResident(data);
            setIsDetailModalOpen(true);
        } catch (error: any) {
            toast.error(
                error.response?.data?.message || 'Không thể tải thông tin cư dân'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = async (id: string) => {
        try {
            setLoading(true);
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };

            const { data } = await axios.get(`/api/residents/${id}`, config);
            setEditFormData(data);
            setIsEditModalOpen(true);
        } catch (error: any) {
            toast.error(
                error.response?.data?.message || 'Không thể tải thông tin cư dân'
            );
        } finally {
            setLoading(false);
        }
    };

    const validateEditForm = () => {
        const errors: Record<string, string> = {};

        if (!editFormData.fullName) errors.fullName = 'Họ tên là bắt buộc';
        if (!editFormData.gender) errors.gender = 'Giới tính là bắt buộc';

        if (editFormData.idCard && !/^\d+$/.test(editFormData.idCard)) {
            errors.idCard = 'CMND/CCCD chỉ được chứa số';
        }

        if (editFormData.phone && !/^\d+$/.test(editFormData.phone)) {
            errors.phone = 'Số điện thoại chỉ được chứa số';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateEditForm()) return;

        try {
            setLoading(true);
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            };

            await axios.put(`/api/residents/${editFormData._id}`, editFormData, config);
            toast.success('Cập nhật cư dân thành công');
            setIsEditModalOpen(false);
            fetchResidents();
        } catch (error: any) {
            toast.error(
                error.response?.data?.message || 'Không thể cập nhật cư dân'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setCreateFormData({
            fullName: '',
            gender: undefined,
            dateOfBirth: '',
            idCard: '',
            idCardDate: '',
            idCardPlace: '',
            placeOfBirth: '',
            nationality: 'Việt Nam',
            ethnicity: 'Kinh',
            religion: 'Không',
            occupation: '',
            workplace: '',
            phone: '',
            note: '',
            active: true
        });
        setIsCreateModalOpen(true);
    };

    const validateCreateForm = () => {
        const errors: Record<string, string> = {};

        if (!createFormData.fullName) errors.fullName = 'Họ tên là bắt buộc';
        if (!createFormData.gender) errors.gender = 'Giới tính là bắt buộc';

        if (createFormData.idCard && !/^\d+$/.test(createFormData.idCard)) {
            errors.idCard = 'CMND/CCCD chỉ được chứa số';
        }

        if (createFormData.phone && !/^\d+$/.test(createFormData.phone)) {
            errors.phone = 'Số điện thoại chỉ được chứa số';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateCreateForm()) return;

        try {
            setLoading(true);
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            };

            await axios.post('/api/residents', createFormData, config);
            toast.success('Thêm cư dân mới thành công');
            setIsCreateModalOpen(false);
            fetchResidents();
        } catch (error: any) {
            toast.error(
                error.response?.data?.message || 'Không thể thêm cư dân mới'
            );
        } finally {
            setLoading(false);
        }
    };

    const filteredResidents = residents.filter((resident) => {
        const searchLower = searchTerm.toLowerCase();
        return (
            resident.fullName?.toLowerCase().includes(searchLower) ||
            resident.idCard?.toLowerCase().includes(searchLower) ||
            resident.phone?.toLowerCase().includes(searchLower) ||
            resident.household?.apartmentNumber?.toLowerCase().includes(searchLower)
        );
    });

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
                        <h1 className="text-2xl font-bold text-gray-900">Danh Sách Cư Dân</h1>
                    </div>
                    <Button
                        onClick={handleCreate}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Thêm Cư Dân
                    </Button>
                </div>

                <div className="mb-6">
                    <Input
                        type="text"
                        placeholder="Tìm kiếm cư dân..."
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
                                        <TableHead>Họ Tên</TableHead>
                                        <TableHead>CMND/CCCD</TableHead>
                                        <TableHead>Ngày Sinh</TableHead>
                                        <TableHead>Giới Tính</TableHead>
                                        <TableHead>Điện Thoại</TableHead>
                                        <TableHead>Hộ Gia Đình</TableHead>
                                        <TableHead>Trạng Thái</TableHead>
                                        <TableHead className="text-center">Thao Tác</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredResidents.map((resident) => (
                                        <TableRow key={resident._id}>
                                            <TableCell className="font-medium">
                                                {resident.fullName}
                                            </TableCell>
                                            <TableCell>{resident.idCard || 'N/A'}</TableCell>
                                            <TableCell>
                                                {resident.dateOfBirth
                                                    ? new Date(resident.dateOfBirth).toLocaleDateString('vi-VN')
                                                    : 'N/A'}
                                            </TableCell>
                                            <TableCell>
                                                {resident.gender === 'male'
                                                    ? 'Nam'
                                                    : resident.gender === 'female'
                                                        ? 'Nữ'
                                                        : 'N/A'}
                                            </TableCell>
                                            <TableCell>{resident.phone || 'N/A'}</TableCell>
                                            <TableCell>
                                                {resident.household
                                                    ? resident.household.apartmentNumber
                                                    : 'Chưa gán'}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {resident.active ? (
                                                        <span className="text-green-600">Hoạt động</span>
                                                    ) : (
                                                        <span className="text-red-600">Không hoạt động</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex justify-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleViewDetails(resident._id)}
                                                        className="hover:bg-blue-50"
                                                    >
                                                        <Eye className="h-4 w-4 text-blue-600" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEdit(resident._id)}
                                                        className="hover:bg-yellow-50"
                                                    >
                                                        <Pencil className="h-4 w-4 text-yellow-600" />
                                                    </Button>
                                                    {user?.role === 'admin' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => deleteHandler(resident._id)}
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
                            {filteredResidents.length === 0 && (
                                <div className="text-center text-gray-500 mt-8">
                                    Không tìm thấy cư dân nào
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold">
                                Thông Tin Chi Tiết Cư Dân
                            </DialogTitle>
                        </DialogHeader>
                        {selectedResident && (
                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <div>
                                    <h3 className="font-semibold mb-2">Thông Tin Cá Nhân</h3>
                                    <div className="space-y-2">
                                        <p><span className="font-medium">Họ và tên:</span> {selectedResident.fullName}</p>
                                        <p><span className="font-medium">Ngày sinh:</span> {selectedResident.dateOfBirth ? new Date(selectedResident.dateOfBirth).toLocaleDateString('vi-VN') : 'N/A'}</p>
                                        <p><span className="font-medium">Giới tính:</span> {selectedResident.gender === 'male' ? 'Nam' : 'Nữ'}</p>
                                        <p><span className="font-medium">Nơi sinh:</span> {selectedResident.placeOfBirth || 'N/A'}</p>
                                        <p><span className="font-medium">Quốc tịch:</span> {selectedResident.nationality || 'N/A'}</p>
                                        <p><span className="font-medium">Dân tộc:</span> {selectedResident.ethnicity || 'N/A'}</p>
                                        <p><span className="font-medium">Tôn giáo:</span> {selectedResident.religion || 'N/A'}</p>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-2">Thông Tin Liên Hệ</h3>
                                    <div className="space-y-2">
                                        <p><span className="font-medium">CMND/CCCD:</span> {selectedResident.idCard || 'N/A'}</p>
                                        <p><span className="font-medium">Ngày cấp:</span> {selectedResident.idCardDate ? new Date(selectedResident.idCardDate).toLocaleDateString('vi-VN') : 'N/A'}</p>
                                        <p><span className="font-medium">Nơi cấp:</span> {selectedResident.idCardPlace || 'N/A'}</p>
                                        <p><span className="font-medium">Số điện thoại:</span> {selectedResident.phone || 'N/A'}</p>
                                        <p><span className="font-medium">Hộ gia đình:</span> {selectedResident.household?.apartmentNumber || 'N/A'}</p>
                                        <p><span className="font-medium">Nghề nghiệp:</span> {selectedResident.occupation || 'N/A'}</p>
                                        <p><span className="font-medium">Nơi làm việc:</span> {selectedResident.workplace || 'N/A'}</p>
                                    </div>
                                </div>
                                {selectedResident.note && (
                                    <div className="col-span-2">
                                        <h3 className="font-semibold mb-2">Ghi Chú</h3>
                                        <p className="text-gray-600">{selectedResident.note}</p>
                                    </div>
                                )}
                                <div className="col-span-2 flex justify-end gap-2 mt-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsDetailModalOpen(false)}
                                    >
                                        Đóng
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            setIsDetailModalOpen(false);
                                            handleEdit(selectedResident._id);
                                        }}
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        <Pencil className="h-4 w-4 mr-2" />
                                        Chỉnh Sửa
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold">
                                Chỉnh Sửa Thông Tin Cư Dân
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleEditSubmit} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName">Họ và Tên</Label>
                                    <Input
                                        id="fullName"
                                        value={editFormData.fullName || ''}
                                        onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                                        className={validationErrors.fullName ? "border-red-500" : ""}
                                    />
                                    {validationErrors.fullName && (
                                        <p className="text-sm text-red-500">{validationErrors.fullName}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="gender">Giới Tính</Label>
                                    <Select
                                        value={editFormData.gender || ''}
                                        onValueChange={(value) => setEditFormData({ ...editFormData, gender: value as 'male' | 'female' })}
                                    >
                                        <SelectTrigger className={validationErrors.gender ? "border-red-500" : ""}>
                                            <SelectValue placeholder="Chọn giới tính" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="male">Nam</SelectItem>
                                            <SelectItem value="female">Nữ</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {validationErrors.gender && (
                                        <p className="text-sm text-red-500">{validationErrors.gender}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="dateOfBirth">Ngày Sinh</Label>
                                    <Input
                                        id="dateOfBirth"
                                        type="date"
                                        value={editFormData.dateOfBirth ? new Date(editFormData.dateOfBirth).toISOString().split('T')[0] : ''}
                                        onChange={(e) => setEditFormData({ ...editFormData, dateOfBirth: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="idCard">CMND/CCCD</Label>
                                    <Input
                                        id="idCard"
                                        value={editFormData.idCard || ''}
                                        onChange={(e) => setEditFormData({ ...editFormData, idCard: e.target.value })}
                                        className={validationErrors.idCard ? "border-red-500" : ""}
                                    />
                                    {validationErrors.idCard && (
                                        <p className="text-sm text-red-500">{validationErrors.idCard}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone">Số Điện Thoại</Label>
                                    <Input
                                        id="phone"
                                        value={editFormData.phone || ''}
                                        onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                                        className={validationErrors.phone ? "border-red-500" : ""}
                                    />
                                    {validationErrors.phone && (
                                        <p className="text-sm text-red-500">{validationErrors.phone}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="household">Hộ Gia Đình</Label>
                                    <Select
                                        value={editFormData.household?._id || 'none'}
                                        onValueChange={(value) => setEditFormData({
                                            ...editFormData,
                                            household: value === 'none' ? undefined : { _id: value, apartmentNumber: '' }
                                        })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Chọn hộ gia đình" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Không thuộc hộ nào</SelectItem>
                                            {households.map((household: Household) => (
                                                <SelectItem key={household._id} value={household._id}>
                                                    {household.apartmentNumber}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="active"
                                    checked={editFormData.active}
                                    onCheckedChange={(checked) => setEditFormData({ ...editFormData, active: checked as boolean })}
                                />
                                <Label htmlFor="active">Đang hoạt động</Label>
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsEditModalOpen(false)}
                                >
                                    Hủy
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-yellow-600 hover:bg-yellow-700"
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
                    </DialogContent>
                </Dialog>

                <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold">
                                Thêm Cư Dân Mới
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateSubmit} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName">Họ và Tên</Label>
                                    <Input
                                        id="fullName"
                                        value={createFormData.fullName}
                                        onChange={(e) => setCreateFormData({ ...createFormData, fullName: e.target.value })}
                                        className={validationErrors.fullName ? "border-red-500" : ""}
                                    />
                                    {validationErrors.fullName && (
                                        <p className="text-sm text-red-500">{validationErrors.fullName}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="gender">Giới Tính</Label>
                                    <Select
                                        value={createFormData.gender}
                                        onValueChange={(value) => setCreateFormData({ ...createFormData, gender: value as 'male' | 'female' })}
                                    >
                                        <SelectTrigger className={validationErrors.gender ? "border-red-500" : ""}>
                                            <SelectValue placeholder="Chọn giới tính" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="male">Nam</SelectItem>
                                            <SelectItem value="female">Nữ</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {validationErrors.gender && (
                                        <p className="text-sm text-red-500">{validationErrors.gender}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="dateOfBirth">Ngày Sinh</Label>
                                    <Input
                                        id="dateOfBirth"
                                        type="date"
                                        value={createFormData.dateOfBirth}
                                        onChange={(e) => setCreateFormData({ ...createFormData, dateOfBirth: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="placeOfBirth">Nơi Sinh</Label>
                                    <Input
                                        id="placeOfBirth"
                                        value={createFormData.placeOfBirth}
                                        onChange={(e) => setCreateFormData({ ...createFormData, placeOfBirth: e.target.value })}
                                        placeholder="Nhập nơi sinh"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="nationality">Quốc Tịch</Label>
                                    <Input
                                        id="nationality"
                                        value={createFormData.nationality}
                                        onChange={(e) => setCreateFormData({ ...createFormData, nationality: e.target.value })}
                                        placeholder="Nhập quốc tịch"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="ethnicity">Dân Tộc</Label>
                                    <Input
                                        id="ethnicity"
                                        value={createFormData.ethnicity}
                                        onChange={(e) => setCreateFormData({ ...createFormData, ethnicity: e.target.value })}
                                        placeholder="Nhập dân tộc"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="religion">Tôn Giáo</Label>
                                    <Input
                                        id="religion"
                                        value={createFormData.religion}
                                        onChange={(e) => setCreateFormData({ ...createFormData, religion: e.target.value })}
                                        placeholder="Nhập tôn giáo"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="idCard">CMND/CCCD</Label>
                                    <Input
                                        id="idCard"
                                        value={createFormData.idCard}
                                        onChange={(e) => setCreateFormData({ ...createFormData, idCard: e.target.value })}
                                        className={validationErrors.idCard ? "border-red-500" : ""}
                                    />
                                    {validationErrors.idCard && (
                                        <p className="text-sm text-red-500">{validationErrors.idCard}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="idCardDate">Ngày Cấp</Label>
                                    <Input
                                        id="idCardDate"
                                        type="date"
                                        value={createFormData.idCardDate}
                                        onChange={(e) => setCreateFormData({ ...createFormData, idCardDate: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="idCardPlace">Nơi Cấp</Label>
                                    <Input
                                        id="idCardPlace"
                                        value={createFormData.idCardPlace}
                                        onChange={(e) => setCreateFormData({ ...createFormData, idCardPlace: e.target.value })}
                                        placeholder="Nhập nơi cấp CMND/CCCD"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone">Số Điện Thoại</Label>
                                    <Input
                                        id="phone"
                                        value={createFormData.phone}
                                        onChange={(e) => setCreateFormData({ ...createFormData, phone: e.target.value })}
                                        className={validationErrors.phone ? "border-red-500" : ""}
                                    />
                                    {validationErrors.phone && (
                                        <p className="text-sm text-red-500">{validationErrors.phone}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="occupation">Nghề Nghiệp</Label>
                                    <Input
                                        id="occupation"
                                        value={createFormData.occupation}
                                        onChange={(e) => setCreateFormData({ ...createFormData, occupation: e.target.value })}
                                        placeholder="Nhập nghề nghiệp"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="workplace">Nơi Làm Việc</Label>
                                    <Input
                                        id="workplace"
                                        value={createFormData.workplace}
                                        onChange={(e) => setCreateFormData({ ...createFormData, workplace: e.target.value })}
                                        placeholder="Nhập nơi làm việc"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="household">Hộ Gia Đình</Label>
                                    <Select
                                        value={createFormData.household?._id || 'none'}
                                        onValueChange={(value) => setCreateFormData({
                                            ...createFormData,
                                            household: value === 'none' ? undefined : { _id: value, apartmentNumber: '' }
                                        })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Chọn hộ gia đình" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Không thuộc hộ nào</SelectItem>
                                            {households.map((household: Household) => (
                                                <SelectItem key={household._id} value={household._id}>
                                                    {household.apartmentNumber}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="note">Ghi Chú</Label>
                                <Textarea
                                    id="note"
                                    value={createFormData.note}
                                    onChange={(e) => setCreateFormData({ ...createFormData, note: e.target.value })}
                                    placeholder="Nhập ghi chú (không bắt buộc)"
                                    rows={3}
                                />
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="active"
                                    checked={createFormData.active}
                                    onCheckedChange={(checked) => setCreateFormData({ ...createFormData, active: checked as boolean })}
                                />
                                <Label htmlFor="active">Đang hoạt động</Label>
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsCreateModalOpen(false)}
                                >
                                    Hủy
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Đang xử lý...
                                        </>
                                    ) : (
                                        'Thêm Mới'
                                    )}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
