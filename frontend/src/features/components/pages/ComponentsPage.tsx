import { useState } from 'react';
import { parseApiError } from '../../../shared/api/errors';
import { formatTimestamp } from '../../../shared/lib/format';
import { usePageTitle } from '../../../shared/lib/use-page-title';
import {
  PAGE_SIZE,
  usePagedSearch,
} from '../../../shared/lib/use-paged-search';
import { ActionsMenu } from '../../../shared/ui/ActionsMenu';
import { Alert } from '../../../shared/ui/Alert';
import { Button } from '../../../shared/ui/Button';
import { EmptyState } from '../../../shared/ui/EmptyState';
import { ListIcon, PlusIcon, SearchIcon } from '../../../shared/ui/icons';
import { ListCard } from '../../../shared/ui/ListCard';
import { Pagination } from '../../../shared/ui/Pagination';
import { Table, TableSkeleton, Td, Th, Tr } from '../../../shared/ui/Table';
import { useCatalog } from '../api/queries';
import { DeleteComponentDialog } from '../components/DeleteComponentDialog';
import { NewComponentDialog } from '../components/NewComponentDialog';
import { RenameDialog } from '../components/RenameDialog';
import type { CatalogComponent } from '../types';

const HEADERS = [
  { text: 'Component name' },
  { text: 'Employees using it', align: 'right' },
  { text: 'Created' },
  { text: 'Actions', align: 'right' },
] as const;

const matches = (component: CatalogComponent, term: string) =>
  component.name.toLowerCase().includes(term);

/**
 * The catalog of component names. A name has no amount here: the amount is set per employee, in
 * that employee's Components tab. Rename changes it for everyone; delete takes it off everyone.
 */
export function ComponentsPage() {
  usePageTitle('Components');
  const catalog = useCatalog();
  const list = usePagedSearch(catalog.data, matches);
  const [creating, setCreating] = useState(false);
  const [renaming, setRenaming] = useState<CatalogComponent | null>(null);
  const [deleting, setDeleting] = useState<CatalogComponent | null>(null);

  const openNew = () => setCreating(true);

  let content;
  if (catalog.isPending) {
    content = (
      <TableSkeleton
        label="Loading components"
        headers={HEADERS.map((header) => ({
          text: header.text,
          align: 'align' in header ? header.align : undefined,
        }))}
      />
    );
  } else if (catalog.isError) {
    content = (
      <div className="p-4">
        <Alert>
          <p>{parseApiError(catalog.error).message}</p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-2"
            loading={catalog.isFetching}
            onClick={() => catalog.refetch()}
          >
            Retry
          </Button>
        </Alert>
      </div>
    );
  } else if (catalog.data.length === 0) {
    content = (
      <EmptyState
        icon={<ListIcon size={48} />}
        title="No components yet"
        description="Components are allowances and other amounts added to an employee's basic salary, such as Rice Allowance. Create the first name here."
        action={
          <Button icon={<PlusIcon />} onClick={openNew}>
            New component
          </Button>
        }
      />
    );
  } else if (list.rows.length === 0) {
    content = (
      <EmptyState
        icon={<SearchIcon size={48} />}
        title={`No components match “${list.search.trim()}”`}
        description="Check the spelling."
        action={
          <Button variant="secondary" onClick={() => list.setSearch('')}>
            Clear search
          </Button>
        }
      />
    );
  } else {
    content = (
      <Table label="Components">
        <thead>
          <tr>
            {HEADERS.map((header) => (
              <Th
                key={header.text}
                align={'align' in header ? header.align : undefined}
              >
                {header.text === 'Actions' ? (
                  <span className="sr-only">Actions</span>
                ) : (
                  header.text
                )}
              </Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {list.visible.map((component) => (
            <Tr key={component.id}>
              <Td className="font-medium">{component.name}</Td>
              <Td align="right">
                <span className="num">{component.usageCount}</span>
              </Td>
              <Td className="whitespace-nowrap">
                {formatTimestamp(component.createdAt)}
              </Td>
              <Td align="right">
                <div className="flex justify-end">
                  <ActionsMenu
                    label={`Actions for ${component.name}`}
                    items={[
                      {
                        label: 'Rename',
                        onSelect: () => setRenaming(component),
                      },
                      {
                        label: 'Delete',
                        onSelect: () => setDeleting(component),
                      },
                    ]}
                  />
                </div>
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">
            Components
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            The names of allowances and other amounts. An amount is set per
            employee, in their Components tab.
          </p>
        </div>
        <Button icon={<PlusIcon />} onClick={openNew}>
          New component
        </Button>
      </div>
      <ListCard
        searchLabel="Search components"
        placeholder="Search by component name"
        search={list.search}
        onSearch={list.setSearch}
        footer={
          catalog.isSuccess && list.rows.length > 0 ? (
            <Pagination
              page={list.page}
              pageSize={PAGE_SIZE}
              total={list.rows.length}
              onPageChange={list.setPage}
            />
          ) : undefined
        }
      >
        {content}
      </ListCard>
      <NewComponentDialog open={creating} onClose={() => setCreating(false)} />
      <RenameDialog
        item={renaming && { componentId: renaming.id, name: renaming.name }}
        onClose={() => setRenaming(null)}
      />
      <DeleteComponentDialog
        item={deleting}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
