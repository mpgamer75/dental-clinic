import { MessageSquareOff } from 'lucide-react';

import { ListToolbar } from '@/components/admin/list-toolbar';
import { PageHeader } from '@/components/admin/page-header';
import { PaginationBar } from '@/components/admin/pagination-bar';
import { EmptyState, ErrorPanel } from '@/components/admin/states';
import { TESTIMONIAL_STATUS_META } from '@/components/admin/status';
import { TestimonialsTable } from '@/components/admin/testimonials-table';
import { TESTIMONIAL_STATUSES } from '@/lib/schema';

import {
  SORT_LABELS,
  TESTIMONIAL_SORTS,
  buildListHref,
  parsePage,
  parseSearch,
  parseTestimonialSort,
  parseTestimonialStatus,
  type RawSearchParams,
} from '../../_lib/list-params';
import { listTestimonials } from '../../_lib/queries';

/* ============================================================================
   /admin/testimonials — the moderation queue
   ----------------------------------------------------------------------------
   Every submission arrives as 'pending_approval'. There is no automatic path
   onto the homepage and there must not be one: the rule this replaces published
   anything a hardcoded blocklist scored 85 or better, under a patient's name,
   on a medical practice's front page.

   The default order is worst moderation score first, with unscored submissions
   ahead of everything — a row that was never assessed is a stronger reason to
   look than a low number. The score orders the queue and decides nothing else.
   ========================================================================== */

export const dynamic = 'force-dynamic';

const PATHNAME = '/admin/testimonials';

const STATUS_OPTIONS = TESTIMONIAL_STATUSES.map((status) => ({
  value: status,
  label: TESTIMONIAL_STATUS_META[status].label,
}));

const SORT_OPTIONS = TESTIMONIAL_SORTS.map((sort) => ({ value: sort, label: SORT_LABELS[sort] }));

export default async function TestimonialsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const raw = await searchParams;

  const query = {
    page: parsePage(raw),
    search: parseSearch(raw),
    status: parseTestimonialStatus(raw),
    sort: parseTestimonialSort(raw),
  };

  const result = await listTestimonials(query);
  const filtered = query.search !== '' || query.status !== null;

  return (
    <>
      <PageHeader
        eyebrow="Testimonios"
        title="Revisión de testimonios"
        description="Nada se publica solo. Lea cada testimonio y decida; al aprobarlo aparece en el sitio con el nombre del paciente."
      />

      <ListToolbar
        pathname={PATHNAME}
        current={raw}
        searchLabel="Buscar testimonio"
        searchPlaceholder="Nombre, localidad o texto"
        statusLabel="Estado"
        statusOptions={STATUS_OPTIONS}
        sortOptions={SORT_OPTIONS}
      />

      {!result.ok ? (
        <ErrorPanel title="No se pudieron cargar los testimonios" detail={result.detail} />
      ) : result.data.rows.length === 0 ? (
        <EmptyState
          icon={MessageSquareOff}
          title={filtered ? 'Ningún resultado' : 'No hay testimonios'}
          description={
            filtered
              ? 'No hay testimonios que coincidan con la búsqueda y el filtro aplicados.'
              : 'Cuando un paciente envíe un testimonio desde el sitio, quedará aquí en espera de revisión.'
          }
          clearHref={
            filtered
              ? buildListHref(PATHNAME, raw, { search: null, status: null, page: null })
              : undefined
          }
        />
      ) : (
        <>
          <TestimonialsTable rows={result.data.rows} />
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
