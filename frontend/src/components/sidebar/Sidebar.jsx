import ProfileCard from './ProfileCard.jsx';
import HowItWorks from './HowItWorks.jsx';
import CampusInfo from './CampusInfo.jsx';

export default function Sidebar({ onLogin, onLogout }) {
  return (
    <aside className="space-y-6">
      <ProfileCard onLogin={onLogin} onLogout={onLogout} />
      <HowItWorks />
      <CampusInfo />
    </aside>
  );
}
