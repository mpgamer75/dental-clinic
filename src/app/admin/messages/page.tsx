
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { generalUiStrings } from "@/lib/data";

export default function AdminMessagesPage() {
  // Admin panel will be primarily in Spanish as requested
  const lang = 'es';
  const adminStrings = generalUiStrings[lang];

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>{adminStrings.messagesTitle}</CardTitle>
          <CardDescription>
            Visualiza y responde a los mensajes de contacto. (Funcionalidad en desarrollo)
          </CardDescription>
        </CardHeader>
        {/* Placeholder content */}
      </Card>
    </div>
  );
}

    