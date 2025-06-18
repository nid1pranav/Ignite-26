import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { uploadsApi } from '@/api/uploads'
import { Brigade } from '@/types'
import { toast } from 'sonner'
import { Upload, FileText, AlertCircle } from 'lucide-react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface UploadStudentsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  brigades: Brigade[]
  onSuccess: () => void
}

export default function UploadStudentsModal({ open, onOpenChange, brigades, onSuccess }: UploadStudentsModalProps) {
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [brigadeId, setBrigadeId] = useState('')
  const [createUserAccounts, setCreateUserAccounts] = useState(false)
  const [uploadResult, setUploadResult] = useState<any>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
      ]
      
      if (allowedTypes.includes(selectedFile.type)) {
        setFile(selectedFile)
        setUploadResult(null)
      } else {
        toast.error('Please select a valid Excel or CSV file')
        e.target.value = ''
      }
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file')
      return
    }

    try {
      setLoading(true)
      const result = await uploadsApi.uploadStudents({
        file,
        brigadeId: brigadeId || undefined,
        createUserAccounts
      })
      
      setUploadResult(result)
      toast.success(result.message)
      
      if (!result.errors || result.errors.length === 0) {
        setTimeout(() => {
          onSuccess()
          onOpenChange(false)
          resetForm()
        }, 2000)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFile(null)
    setBrigadeId('')
    setCreateUserAccounts(false)
    setUploadResult(null)
  }

  const handleClose = () => {
    onOpenChange(false)
    resetForm()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Students</DialogTitle>
          <DialogDescription>
            Upload student data from Excel or CSV file
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Upload */}
          <div className="space-y-2">
            <Label>Select File</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  Click to select Excel or CSV file
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Supported formats: .xlsx, .xls, .csv
                </p>
              </label>
            </div>
            
            {file && (
              <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-800">{file.name}</span>
              </div>
            )}
          </div>

          {/* Brigade Selection */}
          <div className="space-y-2">
            <Label htmlFor="brigade">Assign to Brigade (Optional)</Label>
            <select
              id="brigade"
              value={brigadeId}
              onChange={(e) => setBrigadeId(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="">No Brigade Assignment</option>
              {brigades.map((brigade) => (
                <option key={brigade.id} value={brigade.id}>
                  {brigade.name}
                </option>
              ))}
            </select>
          </div>

          {/* Create User Accounts */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="createAccounts"
              checked={createUserAccounts}
              onChange={(e) => setCreateUserAccounts(e.target.checked)}
              className="rounded border-gray-300"
            />
            <Label htmlFor="createAccounts" className="text-sm">
              Create user accounts for students with email addresses
            </Label>
          </div>

          {/* Upload Result */}
          {uploadResult && (
            <div className="space-y-3">
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800 font-medium">
                  ✅ {uploadResult.imported} students imported successfully
                </p>
              </div>
              
              {uploadResult.errors && uploadResult.errors.length > 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <p className="text-sm text-yellow-800 font-medium">
                      {uploadResult.errors.length} errors found:
                    </p>
                  </div>
                  <div className="max-h-32 overflow-y-auto">
                    {uploadResult.errors.slice(0, 5).map((error: string, index: number) => (
                      <p key={index} className="text-xs text-yellow-700">
                        • {error}
                      </p>
                    ))}
                    {uploadResult.errors.length > 5 && (
                      <p className="text-xs text-yellow-700">
                        ... and {uploadResult.errors.length - 5} more errors
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">File Format Requirements:</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Required columns: Temp Roll Number, First Name, Last Name</li>
              <li>• Optional columns: Email, Phone</li>
              <li>• First row should contain column headers</li>
              <li>• Roll numbers must be unique</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={!file || loading}>
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Uploading...
                </>
              ) : (
                'Upload Students'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}