/**
 * Version Selector & Badges Component
 * Spec Section 4 (Section P) & Section 14
 */

export interface VersionInfo {
  version: string;
  status: 'current' | 'deprecated' | 'experimental' | 'eol';
  notes?: string;
}

export class VersionSelectorComponent {
  private versions: VersionInfo[] = [
    { version: '3.12', status: 'current', notes: 'Pinned Phase 1 reference version' },
    { version: '3.11', status: 'current', notes: 'Specializing adaptive interpreter' },
    { version: '3.10', status: 'current', notes: 'Structural pattern matching' },
    { version: '2.7', status: 'eol', notes: 'End of life. Deprecated and removed.' },
  ];
  private selectedVersion: string = '3.12';

  setSelectedVersion(v: string) {
    this.selectedVersion = v;
  }

  getSelectedVersion(): string {
    return this.selectedVersion;
  }

  static renderBadge(status: VersionInfo['status']): string {
    let color = '#39ff14'; // green for current
    let label = 'Current';
    if (status === 'deprecated') {
      color = '#ffb300';
      label = 'Deprecated';
    } else if (status === 'eol') {
      color = '#ff3860';
      label = 'End of Life';
    } else if (status === 'experimental') {
      color = '#ff2bd6';
      label = 'Experimental';
    }

    return `<span class="version-badge" style="display: inline-block; padding: 2px 6px; font-size: 11px; border-radius: 4px; border: 1px solid ${color}; color: ${color};">${label}</span>`;
  }

  renderHtml(): string {
    const options = this.versions.map((v) => {
      const isSelected = v.version === this.selectedVersion ? 'selected' : '';
      return `<option value="${v.version}" ${isSelected}>Python ${v.version} (${v.status})</option>`;
    }).join('\n');

    const currentInfo = this.versions.find((v) => v.version === this.selectedVersion) || this.versions[0];

    return `
<div class="version-selector-widget" style="display: flex; align-items: center; gap: 8px;">
  <label for="select-lang-version" style="font-size: 13px; color: var(--muted, #7a8ba8);">Version:</label>
  <select id="select-lang-version" class="version-dropdown" style="background: #10162b; color: #e6f1ff; border: 1px solid #1e294b; border-radius: 4px; padding: 4px 8px;">
    ${options}
  </select>
  ${VersionSelectorComponent.renderBadge(currentInfo.status)}
</div>
`.trim();
  }
}
