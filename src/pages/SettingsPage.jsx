import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfile, changePassword } from '../services/authService';
import { MdPerson, MdLock, MdStore, MdSave } from 'react-icons/md';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState({ name: user?.name || '', phone: user?.phone || '', address: user?.address || '', storeName: user?.storeName || '' });
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);

  const handleProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const { data } = await updateProfile(profile);
      updateUser(data.user);
      toast.success('Profile updated');
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed'); }
    finally { setProfileLoading(false); }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    if (pwdForm.newPassword !== pwdForm.confirmPassword) return toast.error('Passwords do not match');
    if (pwdForm.newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    setPwdLoading(true);
    try {
      await changePassword({ currentPassword: pwdForm.currentPassword, newPassword: pwdForm.newPassword });
      toast.success('Password changed successfully');
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to change password'); }
    finally { setPwdLoading(false); }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
        <p className="text-slate-500 text-sm">Manage your account and store settings</p>
      </div>

      {/* Profile */}
      <div className="card">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center"><MdPerson className="text-primary-600" size={20} /></div>
          <div><h2 className="font-semibold text-slate-800">Profile Information</h2><p className="text-slate-400 text-xs">Update your personal details</p></div>
        </div>
        <form onSubmit={handleProfile} className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg">
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div><p className="font-semibold text-slate-800">{user?.name}</p><p className="text-slate-400 text-sm">{user?.email}</p><span className="badge-blue capitalize mt-1">{user?.role}</span></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Full Name</label><input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="input" /></div>
            <div><label className="label">Phone</label><input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="input" /></div>
          </div>
          <div><label className="label">Address</label><input value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} className="input" /></div>
          <button type="submit" disabled={profileLoading} className="btn-primary">
            <MdSave size={16} /> {profileLoading ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>

      {/* Store Settings */}
      <div className="card">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center"><MdStore className="text-emerald-600" size={20} /></div>
          <div><h2 className="font-semibold text-slate-800">Store Settings</h2><p className="text-slate-400 text-xs">Business details used on invoices</p></div>
        </div>
        <div><label className="label">Store Name</label><input value={profile.storeName} onChange={(e) => setProfile({ ...profile, storeName: e.target.value })} className="input" /></div>
        <button onClick={handleProfile} disabled={profileLoading} className="btn-primary mt-4">
          <MdSave size={16} /> Save Store Info
        </button>
      </div>

      {/* Change Password */}
      <div className="card">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center"><MdLock className="text-amber-600" size={20} /></div>
          <div><h2 className="font-semibold text-slate-800">Change Password</h2><p className="text-slate-400 text-xs">Keep your account secure</p></div>
        </div>
        <form onSubmit={handlePassword} className="space-y-4">
          <div><label className="label">Current Password</label><input type="password" value={pwdForm.currentPassword} onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })} className="input" required /></div>
          <div><label className="label">New Password</label><input type="password" value={pwdForm.newPassword} onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })} className="input" required /></div>
          <div><label className="label">Confirm New Password</label><input type="password" value={pwdForm.confirmPassword} onChange={(e) => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })} className="input" required /></div>
          <button type="submit" disabled={pwdLoading} className="btn-primary">
            <MdLock size={16} /> {pwdLoading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>

      {/* App Info */}
      <div className="card bg-slate-50 border-slate-100">
        <h3 className="font-semibold text-slate-600 text-sm mb-3">Application Info</h3>
        <div className="space-y-1 text-xs text-slate-400">
          <p>Version: 1.0.0</p>
          <p>Stack: React + Tailwind + Express + MongoDB</p>
          <p>© 2024 AB Traders. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
