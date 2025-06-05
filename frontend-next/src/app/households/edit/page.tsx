'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import axios from 'axios'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ArrowLeft, Save, Plus, Home } from 'lucide-react'
import { Header } from '@/components/Header'

interface FormData {
    apartmentNumber: string
    address: string
    note: string
    active: boolean
}

interface ValidationErrors {
    apartmentNumber?: string
    address?: string
}

export default function HouseholdEditPage() {
    const [formData, setFormData] = useState<FormData>({
        apartmentNumber: '',
        address: '',
        note: '',
        active: true
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})

    const router = useRouter()
    const searchParams = useSearchParams()
    const householdId = searchParams.get('id')
    const isEditMode = !!householdId
    const { user, token } = useAuth()

    useEffect(() => {
        if (!user || !token) {
            router.push('/login')
            return
        }

        if (isEditMode) {
            fetchHouseholdDetails()
        }
    }, [user, token, householdId, isEditMode])

    const fetchHouseholdDetails = async () => {
        try {
            setLoading(true)
            setError('')

            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }

            const { data } = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/households/${householdId}`, config)

            setFormData({
                apartmentNumber: data.apartmentNumber,
                address: data.address,
                note: data.note || '',
                active: data.active
            })

            setLoading(false)
        } catch (error: any) {
            setError(
                error.response?.data?.message || 'Không thể tải thông tin hộ gia đình'
            )
            setLoading(false)
        }
    }

    const validateForm = (): boolean => {
        const errors: ValidationErrors = {}

        if (!formData.apartmentNumber.trim()) {
            errors.apartmentNumber = 'Số căn hộ là bắt buộc'
        }

        if (!formData.address.trim()) {
            errors.address = 'Địa chỉ là bắt buộc'
        }

        setValidationErrors(errors)
        return Object.keys(errors).length === 0
    }

    const handleInputChange = (field: keyof FormData, value: string | boolean) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))

        // Clear validation error when user starts typing
        if (validationErrors[field as keyof ValidationErrors]) {
            setValidationErrors(prev => ({
                ...prev,
                [field]: undefined
            }))
        }
    }

    const submitHandler = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        try {
            setLoading(true)
            setError('')

            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            }

            const householdData = {
                apartmentNumber: formData.apartmentNumber,
                address: formData.address,
                note: formData.note,
                active: formData.active
            }

            if (isEditMode) {
                await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/households/${householdId}`, householdData, config)
            } else {
                await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/households`, householdData, config)
            }

            setLoading(false)
            setSuccess(true)

            setTimeout(() => {
                router.push('/households')
            }, 2000)

        } catch (error: any) {
            setError(
                error.response?.data?.message ||
                `Không thể ${isEditMode ? 'cập nhật' : 'tạo'} hộ gia đình`
            )
            setLoading(false)
        }
    }

    if (loading && isEditMode && !formData.apartmentNumber) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <div className="container mx-auto px-4 py-8 max-w-3xl">
                {/* Header Section */}
                <div className="flex items-center gap-4 mb-6">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push('/households')}
                        className="hover:bg-gray-100"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Quay lại
                    </Button>
                    <div className="flex items-center gap-2">
                        <Home className="h-6 w-6 text-blue-600" />
                        <h1 className="text-2xl font-bold text-gray-900">
                            {isEditMode ? 'Chỉnh Sửa Hộ Gia Đình' : 'Thêm Hộ Gia Đình Mới'}
                        </h1>
                    </div>
                </div>

                {/* Alert Messages */}
                {error && (
                    <Alert className="mb-6 border-red-200 bg-red-50">
                        <AlertDescription className="text-red-800">
                            {error}
                        </AlertDescription>
                    </Alert>
                )}

                {success && (
                    <Alert className="mb-6 border-green-200 bg-green-50">
                        <AlertDescription className="text-green-800">
                            Hộ gia đình đã được {isEditMode ? 'cập nhật' : 'tạo'} thành công!
                        </AlertDescription>
                    </Alert>
                )}

                {/* Main Form Card */}
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            {isEditMode ? (
                                <>
                                    <Home className="h-5 w-5 text-orange-600" />
                                    Cập nhật thông tin hộ gia đình
                                </>
                            ) : (
                                <>
                                    <Plus className="h-5 w-5 text-green-600" />
                                    Thêm hộ gia đình mới
                                </>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submitHandler} className="space-y-6">
                            {/* Apartment Number */}
                            <div className="space-y-2">
                                <Label htmlFor="apartmentNumber" className="text-sm font-medium">
                                    Số Căn Hộ <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="apartmentNumber"
                                    type="text"
                                    placeholder="Nhập số căn hộ (ví dụ: A101, B205)"
                                    value={formData.apartmentNumber}
                                    onChange={(e) => handleInputChange('apartmentNumber', e.target.value)}
                                    className={validationErrors.apartmentNumber
                                        ? 'border-red-500 focus:border-red-500'
                                        : 'focus:border-blue-500'
                                    }
                                    disabled={loading}
                                />
                                {validationErrors.apartmentNumber && (
                                    <p className="text-sm text-red-600 mt-1">
                                        {validationErrors.apartmentNumber}
                                    </p>
                                )}
                            </div>

                            {/* Address */}
                            <div className="space-y-2">
                                <Label htmlFor="address" className="text-sm font-medium">
                                    Địa Chỉ <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="address"
                                    type="text"
                                    placeholder="Nhập địa chỉ đầy đủ"
                                    value={formData.address}
                                    onChange={(e) => handleInputChange('address', e.target.value)}
                                    className={validationErrors.address
                                        ? 'border-red-500 focus:border-red-500'
                                        : 'focus:border-blue-500'
                                    }
                                    disabled={loading}
                                />
                                {validationErrors.address && (
                                    <p className="text-sm text-red-600 mt-1">
                                        {validationErrors.address}
                                    </p>
                                )}
                            </div>

                            {/* Note */}
                            <div className="space-y-2">
                                <Label htmlFor="note" className="text-sm font-medium">
                                    Ghi Chú
                                </Label>
                                <Textarea
                                    id="note"
                                    placeholder="Nhập ghi chú (không bắt buộc)"
                                    value={formData.note}
                                    onChange={(e) => handleInputChange('note', e.target.value)}
                                    rows={4}
                                    className="resize-none focus:border-blue-500"
                                    disabled={loading}
                                />
                                <p className="text-xs text-gray-500">
                                    Có thể thêm thông tin bổ sung về hộ gia đình
                                </p>
                            </div>

                            {/* Active Status - Only show in edit mode */}
                            {isEditMode && (
                                <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                                    <div className="space-y-1">
                                        <Label htmlFor="active" className="text-sm font-medium">
                                            Trạng thái hoạt động
                                        </Label>
                                        <p className="text-xs text-gray-600">
                                            Bật/tắt trạng thái hoạt động của hộ gia đình
                                        </p>
                                    </div>
                                    <Switch
                                        id="active"
                                        checked={formData.active}
                                        onCheckedChange={(checked) => handleInputChange('active', checked)}
                                        disabled={loading}
                                    />
                                </div>
                            )}

                            {/* Form Actions */}
                            <div className="flex gap-4 pt-6 border-t">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.push('/households')}
                                    disabled={loading}
                                    className="flex-1"
                                >
                                    Hủy bỏ
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className={`flex-1 ${isEditMode
                                            ? 'bg-orange-600 hover:bg-orange-700'
                                            : 'bg-green-600 hover:bg-green-700'
                                        }`}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            {isEditMode ? 'Đang cập nhật...' : 'Đang tạo...'}
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4 mr-2" />
                                            {isEditMode ? 'Cập Nhật' : 'Tạo Mới'}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Help Section */}
                <Card className="mt-6 bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                        <h3 className="font-medium text-blue-900 mb-2">Hướng dẫn</h3>
                        <ul className="text-sm text-blue-800 space-y-1">
                            <li>• Số căn hộ và địa chỉ là các trường bắt buộc</li>
                            <li>• Số căn hộ nên theo định dạng: A101, B205, etc.</li>
                            <li>• Ghi chú có thể bỏ trống hoặc thêm thông tin bổ sung</li>
                            {isEditMode && (
                                <li>• Có thể bật/tắt trạng thái hoạt động của hộ gia đình</li>
                            )}
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
