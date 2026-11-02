import { PlayCircleOutlined } from '@ant-design/icons'
import { Flex, Modal, Table, Tag, Typography } from 'antd'
import { useContext, useState, type HTMLAttributes } from 'react'
import { AxisButton } from '../platform/AxisButton'
import { releaseActorName, releaseGroups, type StudioReleaseGroup, type StudioReleases } from '../platform/studio'
import { fitContent, freeText } from '../platform/tableColumns'
import { useText } from '../platform/texts'
import { useDesignTokens } from '../platform/themeMode'
import { PlatformContext } from './context'

/**
 * Proposed: the releases of the open application, one row per release, the highest number first: its label and note,
 * which its publish gave, who published it and when, and Live on the one that runs, as the band says. When
 * `canActivate`, every release that is not live has an icon button, Activate…, off while `busy`: activating goes
 * either way, back to an older release or forward to a newer one, so one verb names it. The button opens a dialog that
 * says which release replaces the live one, and its confirmation calls `onActivate`.
 */
export function StudioReleasesList({
  history,
  canRollBack: canActivate,
  busy,
  onRollBack: onActivate,
}: {
  history: StudioReleases
  canRollBack: boolean
  busy: boolean
  onRollBack: (release: { releaseId: string }) => void
}) {
  const t = useText()
  const { colour } = useDesignTokens()
  const locale = useContext(PlatformContext)?.current.locale
  const [pending, setPending] = useState<StudioReleaseGroup | null>(null)
  const time = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' })
  const live = history.active?.number

  function confirm() {
    const release = pending
    setPending(null)
    if (release) {
      onActivate(release)
    }
  }

  return (
    <section data-testid="studio-releases">
      <Flex vertical gap="small">
        <Table<StudioReleaseGroup>
          size="small"
          pagination={false}
          // Proposed: where the page is narrower than the columns' content, the table scrolls sideways.
          scroll={{ x: 'max-content' }}
          rowKey={(release) => release.releaseId}
          dataSource={releaseGroups(history)}
          locale={{ emptyText: t('shell.studio.releases.empty') }}
          onRow={(release) =>
            ({
              'data-testid': 'studio-release-row',
              'data-number': release.number,
              'data-active': release.live ? 'true' : undefined,
            }) as HTMLAttributes<HTMLElement>
          }
          columns={[
            {
              key: 'number',
              title: t('shell.studio.releases.number'),
              ...fitContent,
              render: (_, release) => release.number,
            },
            {
              key: 'label',
              title: t('shell.studio.releases.label'),
              ...freeText,
              render: (_, release) => release.label,
            },
            { key: 'note', title: t('shell.studio.releases.note'), ...freeText, render: (_, release) => release.note },
            {
              key: 'published',
              title: t('shell.studio.releases.published'),
              ...fitContent,
              render: (_, release) =>
                `${releaseActorName(release.published, t)} · ${time.format(new Date(release.published.activatedAt))}`,
            },
            {
              key: 'status',
              title: t('shell.studio.releases.status'),
              ...fitContent,
              render: (_, release) =>
                release.live ? <Tag color="success">{t('shell.studio.releases.live')}</Tag> : null,
            },
            ...(canActivate
              ? [
                  {
                    key: 'activate',
                    ...fitContent,
                    render: (_: unknown, release: StudioReleaseGroup) =>
                      release.live ? null : (
                        <AxisButton
                          role="icon"
                          size="small"
                          nameKey="shell.studio.activate"
                          nameSuffix={`${t('shell.studio.rollback.release')} ${release.number}`}
                          icon={<PlayCircleOutlined />}
                          disabled={busy}
                          data-testid={`studio-activate-${release.number}`}
                          onClick={() => setPending(release)}
                        />
                      ),
                  },
                ]
              : []),
          ]}
        />
      </Flex>
      <Modal
        open={pending !== null}
        title={t('shell.studio.activate.title').replace('{number}', String(pending?.number ?? ''))}
        okText={t('shell.studio.activate.confirm')}
        cancelText={t('shell.studio.cancel')}
        onOk={confirm}
        onCancel={() => setPending(null)}
      >
        {pending && (
          <Flex vertical gap={4} data-testid="studio-rollback-release">
            <Typography.Text>
              {(live === undefined ? t('shell.studio.activate.first') : t('shell.studio.activate.replaces'))
                .replace('{number}', String(pending.number))
                .replace('{live}', String(live ?? ''))}
            </Typography.Text>
            {pending.label && <Typography.Text style={{ color: colour.textMuted }}>{pending.label}</Typography.Text>}
          </Flex>
        )}
      </Modal>
    </section>
  )
}
