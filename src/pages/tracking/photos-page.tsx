import { useState, useRef } from 'react'
import { Camera, Upload } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { EmptyState } from '@/components/shared/empty-state'
import { useProgressPhotos, useUploadProgressPhoto } from '@/hooks/use-tracking'
import { todayStr } from '@/utils/date'
import type { PhotoAngle } from '@/types/database.types'
import { format, parseISO } from 'date-fns'
import { trackingService } from '@/services/tracking.service'
import { useQuery } from '@tanstack/react-query'

function PhotoThumb({ path }: { path: string }) {
  const { data: url } = useQuery({ queryKey: ['photo-url', path], queryFn: () => trackingService.getProgressPhotoUrl(path) })
  return url ? <img src={url} alt="progress" className="h-full w-full object-cover" /> : <div className="h-full w-full bg-muted animate-pulse" />
}

export default function PhotosPage() {
  const { data: photos, isLoading } = useProgressPhotos()
  const upload = useUploadProgressPhoto()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [angle, setAngle] = useState<PhotoAngle>('front')
  const [compareA, setCompareA] = useState<string>('')
  const [compareB, setCompareB] = useState<string>('')
  const [sliderPos, setSliderPos] = useState(50)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await upload.mutateAsync({ date: todayStr(), angle, file })
    e.target.value = ''
  }

  const urlFor = (path: string) => trackingService.getProgressPhotoUrl(path)
  const photoA = photos?.find((p) => p.id === compareA)
  const photoB = photos?.find((p) => p.id === compareB)
  const { data: urlA } = useQuery({ queryKey: ['photo-url', photoA?.storage_path], queryFn: () => urlFor(photoA!.storage_path), enabled: !!photoA })
  const { data: urlB } = useQuery({ queryKey: ['photo-url', photoB?.storage_path], queryFn: () => urlFor(photoB!.storage_path), enabled: !!photoB })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Camera className="size-6 text-pink-500" /> Progress Photos
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Upload New Photo</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Select value={angle} onChange={(e) => setAngle(e.target.value as PhotoAngle)} className="max-w-[140px]">
            <option value="front">Front</option>
            <option value="side">Side</option>
            <option value="back">Back</option>
          </Select>
          <Button variant="gradient" onClick={() => fileInputRef.current?.click()} disabled={upload.isPending}>
            <Upload className="size-4" /> Upload Photo
          </Button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
        </CardContent>
      </Card>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : photos && photos.length > 0 ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Compare Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Select value={compareA} onChange={(e) => setCompareA(e.target.value)}>
                  <option value="">Select photo A</option>
                  {photos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {format(parseISO(p.date), 'MMM d, yyyy')} — {p.angle}
                    </option>
                  ))}
                </Select>
                <Select value={compareB} onChange={(e) => setCompareB(e.target.value)}>
                  <option value="">Select photo B</option>
                  {photos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {format(parseISO(p.date), 'MMM d, yyyy')} — {p.angle}
                    </option>
                  ))}
                </Select>
              </div>

              {urlA && urlB && (
                <div className="relative aspect-[3/4] max-w-md mx-auto rounded-2xl overflow-hidden border border-border">
                  <img src={urlA} alt="Before" className="absolute inset-0 h-full w-full object-cover" />
                  <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}>
                    <img src={urlB} alt="After" className="h-full w-full object-cover" />
                  </div>
                  <div className="absolute inset-y-0 bg-white w-0.5" style={{ left: `${sliderPos}%` }} />
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={sliderPos}
                    onChange={(e) => setSliderPos(Number(e.target.value))}
                    className="absolute bottom-3 left-1/2 -translate-x-1/2 w-3/4"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>All Photos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {photos.map((photo) => (
                  <div key={photo.id} className="aspect-[3/4] rounded-xl overflow-hidden bg-muted relative">
                    <PhotoThumb path={photo.storage_path} />
                    <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">
                      {format(parseISO(photo.date), 'MMM d')}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <EmptyState icon={Camera} title="No photos yet" description="Upload your first progress photo to start tracking visually." />
      )}
    </div>
  )
}
