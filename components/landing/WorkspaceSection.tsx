import ReadinessCard from '@/components/landing/screens/ReadinessCard'
import CopilotThread from '@/components/landing/screens/CopilotThread'
import AppFrame from '@/components/landing/AppFrame'
import { LandingIcon } from '@/components/landing/icons'
import { MATRIX_ROWS, type MatrixCell } from '@/components/landing/data'

function cell(v: MatrixCell) {
  if (v === 'yes') return <span className="m-yes">{LandingIcon.check}</span>
  if (v === 'other') return <span className="m-other">{LandingIcon.check}</span>
  if (v === 'plan') return <span className="m-plan">Phase 4 · not started</span>
  if (v === 'p3') return <span className="m-plan">Phase 3</span>
  return <span className="m-no">—</span>
}

/* Comparison matrix — what you have vs the market. Auto-built from the scan. */
function MatrixScreen() {
  return (
    <AppFrame figN="Fig. 4" cap="Positioning · you vs the market" note={<span className="af-note">auto-built from the scan</span>}>
      <table className="matrix">
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>Capability</th>
            <th className="you">You</th>
            <th>Enterpret</th>
            <th>Dovetail</th>
            <th>Unwrap.ai</th>
          </tr>
        </thead>
        <tbody>
          {MATRIX_ROWS.map((r) => (
            <tr key={r.feat}>
              <td className="feat">{r.feat}</td>
              <td className="you-col">{cell(r.you)}</td>
              <td>{cell(r.E)}</td>
              <td>{cell(r.D)}</td>
              <td>{cell(r.U)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </AppFrame>
  )
}

/* =========================================================================
   4 · Readiness + Copilot — split screen, no border between halves.
   A shared context bar confirms both are the same session. Below it, the
   positioning table you'd act on.
   ========================================================================= */
export default function WorkspaceSection() {
  return (
    <section id="workspace" className="chapter" data-screen-label="In actual use">
      <div className="wrapc wide">
        <div className="chead">
          <span className="kicker">In actual use · one Tuesday morning</span>
          <h2>One session, two views.</h2>
        </div>
      </div>

      <div className="wrapc noted">
        <div className="whisper">
          <span className="wl">64% —</span>
          <span className="wl">one move left</span>
          <span className="wl">before you build.</span>
          <b>that&apos;s the whole game</b>
        </div>

        <div className="session">
          <div className="session-bar">
            <span className="sb-lab">Session</span>
            <span className="sb-chip">
              <i />
              idea #2 · <b>feedback intelligence</b>
            </span>
            <span className="sb-sep" />
            <span className="sb-chip">
              <i />5 competitors · <b>Enterpret 73%</b>
            </span>
            <span className="sb-sep" />
            <span className="sb-chip">
              <i className="analyzing" />
              Unwrap.ai analyzing
            </span>
            <span className="sb-sep" />
            <span className="sb-chip">
              <i className="warn" />
              readiness <b>64%</b> · GTM missing
            </span>
          </div>
          <div className="split">
            <div className="split-left">
              <div className="split-lab">Startup readiness · the thread</div>
              <ReadinessCard />
            </div>
            <div className="split-right">
              <div className="split-lab">Copilot · full workspace in context</div>
              <CopilotThread />
            </div>
          </div>
        </div>
      </div>

      <div className="wrapc" style={{ marginTop: 26 }}>
        <MatrixScreen />
        <p className="demo-stakes" style={{ marginTop: 26 }}>
          <span style={{ fontSize: 17 }}>
            One column is yours alone — <span style={{ color: 'var(--accent)' }}>themes ranked to a live roadmap</span>.
            The honest gaps are here too: per-theme scoring and CRM sync aren&apos;t built yet.
          </span>
        </p>
      </div>
    </section>
  )
}
