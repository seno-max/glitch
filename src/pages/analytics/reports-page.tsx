import { FileText, Download } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAnalyticsSummary } from '@/hooks/use-analytics'
import { usePersonalRecords } from '@/hooks/use-analytics'
import { useAuthStore } from '@/stores/auth.store'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function ReportsPage() {
  const { profile } = useAuthStore()
  const { data: monthly } = useAnalyticsSummary(30)
  const { data: yearly } = useAnalyticsSummary(365)
  const { data: records } = usePersonalRecords()

  const generateReport = (period: 'monthly' | 'yearly') => {
    const data = period === 'monthly' ? monthly : yearly
    if (!data) {
      toast.error('Data not loaded yet')
      return
    }

    const doc = new jsPDF()
    doc.setFontSize(20)
    doc.text('FitTrack Report', 14, 20)
    doc.setFontSize(11)
    doc.setTextColor(100)
    doc.text(`${period === 'monthly' ? 'Monthly' : 'Yearly'} Review — Generated ${format(new Date(), 'MMM d, yyyy')}`, 14, 28)
    doc.text(`Athlete: ${profile?.full_name ?? 'N/A'}`, 14, 34)

    autoTable(doc, {
      startY: 42,
      head: [['Metric', 'Value']],
      body: [
        ['Workout Hours', `${data.workoutHours}h`],
        ['Strength Volume', `${data.strengthVolumeKg.toLocaleString()} kg`],
        ['Cardio Hours', `${data.cardioHours}h`],
        ['Cardio Distance', `${data.cardioDistanceKm} km`],
        ['Average Workout Duration', `${data.avgWorkoutMinutes} min`],
        ['Average Steps', data.avgSteps.toLocaleString()],
        ['Average Water Intake', `${(data.avgWaterMl / 1000).toFixed(1)} L`],
        ['Food Logging Rate', `${data.foodLoggingRatePct}%`],
        ['Weekly Score', data.weeklyScore.toString()],
        ['Monthly Score', data.monthlyScore.toString()],
        ['Most Active Day', data.mostActiveDay ?? 'N/A'],
      ],
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] },
    })

    if (records && records.length > 0) {
      autoTable(doc, {
        head: [['Personal Record', 'Value', 'Date']],
        body: records.slice(0, 15).map((r) => [r.category.replace(/_/g, ' '), `${r.value} ${r.unit ?? ''}`, r.achieved_date]),
        theme: 'grid',
        headStyles: { fillColor: [139, 92, 246] },
      })
    }

    doc.save(`fittrack-${period}-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`)
    toast.success('Report downloaded!')
  }

  const reports = [
    { title: 'Workout Summary', description: 'Strength & cardio breakdown' },
    { title: 'Strength Progress', description: 'Volume and PR trends' },
    { title: 'Cardio Summary', description: 'Distance, time, calories' },
    { title: 'Weight Progress', description: 'Trend and goal tracking' },
    { title: 'Food Summary', description: 'Nutrition logging overview' },
    { title: 'Water Summary', description: 'Hydration tracking' },
    { title: 'Achievements', description: 'Unlocked badges' },
    { title: 'Health Score', description: 'Daily score history' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <FileText className="size-6 text-primary" /> Reports
      </h1>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="card-hover">
          <CardHeader>
            <CardTitle>Monthly Review</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Complete summary of your last 30 days of activity.</p>
            <Button variant="gradient" className="w-full" onClick={() => generateReport('monthly')}>
              <Download className="size-4" /> Download PDF
            </Button>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardHeader>
            <CardTitle>Yearly Review</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Full year overview with all your key metrics.</p>
            <Button variant="gradient" className="w-full" onClick={() => generateReport('yearly')}>
              <Download className="size-4" /> Download PDF
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Sections Included</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-2">
          {reports.map((r) => (
            <div key={r.title} className="flex items-center gap-3 rounded-xl bg-muted/40 p-3">
              <FileText className="size-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm font-medium">{r.title}</p>
                <p className="text-xs text-muted-foreground">{r.description}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
