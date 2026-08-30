import { CalendarX2 } from 'lucide-react';

import { AppointmentsTable } from '@/components/admin/appointments-table';
import { ListToolbar } from '@/components/admin/list-toolbar';
import { PageHeader } from '@/components/admin/page-header';
import { PaginationBar } from '@/components/admin/pagination-bar';
import { EmptyState, ErrorPanel } from '@/components/admin/states';
import { APPOINTMENT_STATUS_META } from '@/components/admin/status';
import { APPOINTMENT_STATUSES } from '@/lib/schema';

import {
  APPOINTMENT_SORTS,
  SORT_LABELS,
  buildListHref,
  parseAppointmentSort,
  parseAppointmentStatus,
  parsePage,
  parseSearch,
  type RawSearchParams,
} from '../../_lib/list-params';
import { listAppointments } from '../../_lib/queries';

/* ============================================================================
   /admin/appointments
   ----------------------------------------------------------------------------
   The whole appointment book, twenty rows at a time, ordered by the queue: the
   urgent first, then whoever has waited longest. Search, filter, sort and page
   all live in the query string and are all resolved in Postgres — the browser
   never holds more than the page it is showing, and the caption underneath
   states a real `count(*)`.
   ========================================================================== */

export const dynamic = 'force-dynamic';

const PATHNAME = '/admin/appointments';

const STATUS_OPTIONS = APPOINTMENT_STATUSES.map((status) => ({
  value: status,
  label: APPOINTMENT_STATUS_META[status].label,
}));

const SORT_OPTIONS = APPOINTMENT_SORTS.map((sort) => ({ value: sort, label: SORT_LABELS[sort] }));

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const raw = await searchParams;

  const query = {
    page: parsePage(raw),
    search: parseSearch(raw),
    status: parseAppointmentStatus(raw),
    sort: parseAppointmentSort(raw),
  };

  const result = await listAppointments(query);
  const filtered = query.search !== '' || query.status !== null;

  return (
    <>
      <PageHeader
        eyebrow="Citas"
        title="Solicitudes de cita"
        description="Cada fila es un paciente esperando una llamada. Las urgentes encabezan la lista."
      />

      <ListToolbar
        pathname={PATHNAME}
        current={raw}
        searchLabel="Buscar paciente"
        searchPlaceholder="Nombre, correo, teléfono o servicio"
        statusLabel="Estado"
        statusOptions={STATUS_OPTIONS}
        sortOptions={SORT_OPTIONS}
      />

      {!result.ok ? (
        <ErrorPanel title="No se pudieron cargar las citas" detail={result.detail} />
      ) : result.data.rows.length === 0 ? (
        <EmptyState
          icon={CalendarX2}
          title={filtered ? 'Ningún resultado' : 'Todavía no hay solicitudes'}
          description={
            filtered
              ? 'No hay citas que coincidan con la búsqueda y el filtro aplicados. Pruebe con otros términos o quite los filtros.'
              : 'Cuando un paciente rellene el formulario de cita del sitio, su solicitud aparecerá aquí.'
          }
          clearHref={
            filtered
              ? buildListHref(PATHNAME, raw, { search: null, status: null, page: null })
              : undefined
          }
        />
      ) : (
        <>
          <AppointmentsTable rows={result.data.rows} />
          <PaginationBar
            pathname={PATHNAME}
            current={raw}
            page={result.data.page}
            pageSize={result.data.pageSize}
            total={result.data.total}
          />
        </>
      )}
    </>
  );
}
