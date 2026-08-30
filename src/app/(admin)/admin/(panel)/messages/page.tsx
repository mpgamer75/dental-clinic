import { MailX } from 'lucide-react';

import { ListToolbar } from '@/components/admin/list-toolbar';
import { MessagesTable } from '@/components/admin/messages-table';
import { PageHeader } from '@/components/admin/page-header';
import { PaginationBar } from '@/components/admin/pagination-bar';
import { EmptyState, ErrorPanel } from '@/components/admin/states';
import { MESSAGE_STATUS_META } from '@/components/admin/status';
import { CONTACT_MESSAGE_STATUSES } from '@/lib/schema';

import {
  MESSAGE_SORTS,
  SORT_LABELS,
  buildListHref,
  parseMessageSort,
  parseMessageStatus,
  parsePage,
  parseSearch,
  type RawSearchParams,
} from '../../_lib/list-params';
import { listMessages } from '../../_lib/queries';

/* ============================================================================
   /admin/messages
   ----------------------------------------------------------------------------
   The contact form's inbox. Newest first by default — unlike the appointment
   queue, where age is the thing that matters, a written enquiry is normally
   read in the order it arrived and the "sin leer" filter is what turns it into
   a work list.
   ========================================================================== */

export const dynamic = 'force-dynamic';

const PATHNAME = '/admin/messages';

const STATUS_OPTIONS = CONTACT_MESSAGE_STATUSES.map((status) => ({
  value: status,
  label: MESSAGE_STATUS_META[status].label,
}));

const SORT_OPTIONS = MESSAGE_SORTS.map((sort) => ({ value: sort, label: SORT_LABELS[sort] }));

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const raw = await searchParams;

  const query = {
    page: parsePage(raw),
    search: parseSearch(raw),
    status: parseMessageStatus(raw),
    sort: parseMessageSort(raw),
  };

  const result = await listMessages(query);
  const filtered = query.search !== '' || query.status !== null;

  return (
    <>
      <PageHeader
        eyebrow="Mensajes"
        title="Mensajes de contacto"
        description="Consultas escritas desde el formulario del sitio. Archívelas cuando estén resueltas."
      />

      <ListToolbar
        pathname={PATHNAME}
        current={raw}
        searchLabel="Buscar mensaje"
        searchPlaceholder="Nombre, correo o texto del mensaje"
        statusLabel="Estado"
        statusOptions={STATUS_OPTIONS}
        sortOptions={SORT_OPTIONS}
      />

      {!result.ok ? (
        <ErrorPanel title="No se pudieron cargar los mensajes" detail={result.detail} />
      ) : result.data.rows.length === 0 ? (
        <EmptyState
          icon={MailX}
          title={filtered ? 'Ningún resultado' : 'Bandeja vacía'}
          description={
            filtered
              ? 'No hay mensajes que coincidan con la búsqueda y el filtro aplicados.'
              : 'Cuando alguien escriba desde el formulario de contacto del sitio, su mensaje aparecerá aquí.'
          }
          clearHref={
            filtered
              ? buildListHref(PATHNAME, raw, { search: null, status: null, page: null })
              : undefined
          }
        />
      ) : (
        <>
          <MessagesTable rows={result.data.rows} />
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
