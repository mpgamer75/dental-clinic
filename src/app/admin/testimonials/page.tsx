
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { generalUiStrings } from "@/lib/data";

export default function AdminTestimonialsPage() {
  // Admin panel will be primarily in Spanish as requested
  const lang = 'es';
  const adminStrings = generalUiStrings[lang];

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>{adminStrings.testimonialsTitle}</CardTitle>
          <CardDescription>
            Modera y gestiona los testimonios de los pacientes. (Funcionalidad en desarrollo)
          </CardDescription>
        </CardHeader>
        {/* Placeholder content */}
      </Card>
    </div>
  );
}

    