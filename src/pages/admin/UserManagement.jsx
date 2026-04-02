import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Upload, User, ShieldCheck } from 'lucide-react';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import { userService } from '../../services/userService';
import api from '../../services/api';

const UserManagement = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedRoleForModal, setSelectedRoleForModal] = useState('student');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isBulkImporting, setIsBulkImporting] = useState(false);

    const [users, setUsers] = useState([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const data = await userService.getAllUsers();
                const formattedUsers = data.map(user => ({
                    ...user,
                    id: user._id, 
                    status: 'active'
                }));
                setUsers(formattedUsers);
            } catch (error) {
                console.error("Failed to load users:", error);
            } finally {
                setIsLoadingUsers(false);
            }
        };

        fetchUsers();
    }, []);

    const handleCSVUpload = async (e, role) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target.result;
            const rows = text.split(/\r?\n/).filter(row => row.trim() !== '');
            
            const startIndex = rows[0].toLowerCase().includes('email') ? 1 : 0;
            const userData = rows.slice(startIndex).map(row => {
                const parts = row.split(',');
                return {
                    name: parts[0]?.trim(),
                    email: parts[1]?.trim(),
                    assignedClass: role === 'student' ? (parts[2]?.trim() || 'Unassigned') : role === 'teacher' ? 'Teacher' : 'Admin',
                    role: role
                };
            }).filter(u => u.name && u.email);

            if (userData.length === 0) {
                alert(`No valid users found in CSV. Format should be: Name, Email${role === 'student' ? ', Class (optional)' : ''}`);
                return;
            }

            if (!window.confirm(`Register ${userData.length} ${role}s from CSV? Emails will be sent.`)) return;

            try {
                setIsBulkImporting(true);
                const res = await api.post('/admin/register-bulk', { users: userData });
                alert(`Bulk Import Complete: ${res.data.details.filter(d => d.status === 'success').length} succeeded.`);
                window.location.reload(); 
            } catch (err) {
                alert("Bulk Import Failed: " + (err.response?.data?.message || err.message));
            } finally {
                setIsBulkImporting(false);
            }
        };
        reader.readAsText(file);
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              user.role.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const handleEdit = (user) => {
        setSelectedUser(user);
        setSelectedRoleForModal(user.role || 'student');
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setSelectedUser(null);
        setSelectedRoleForModal('student');
        setIsModalOpen(true);
    };

    const handleSaveUser = async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        
        let calculatedClass = formData.get('userClass') || 'Unassigned';
        if (formData.get('userRole') === 'teacher') calculatedClass = 'Teacher';
        if (formData.get('userRole') === 'admin') calculatedClass = 'Admin';

        const userData = {
            name: formData.get('userName'),
            email: formData.get('userEmail'),
            role: formData.get('userRole'),
            assignedClass: calculatedClass
        };

        try {
            setIsSubmitting(true);
            
            if (!selectedUser) {
                const response = await userService.createUser(userData);
                
                const newUser = {
                    id: response.userId || Date.now(),
                    name: userData.name,
                    email: userData.email,
                    role: userData.role,
                    assignedClass: userData.assignedClass,
                    status: 'active'
                };
                setUsers([...users, newUser]);
                alert(`${userData.role} successfully registered! Passwords sent via email.`);
            } else {
                await userService.updateUser(selectedUser.id, userData);
                setUsers(users.map(u => 
                    u.id === selectedUser.id ? { ...u, ...userData } : u
                ));
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error('Error saving user:', error);
            alert(error.response?.data?.message || 'Error registering user.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this user? Action cannot be undone.')) {
            try {
                await userService.deleteUser(id);
                setUsers(users.filter(u => u.id !== id));
            } catch (error) {
                console.error('Error deleting user:', error);
                alert(error.response?.data?.message || 'Failed to delete user.');
            }
        }
    };

    return (
        <div className="pb-8">
            <div className="p-4 sm:p-8 space-y-8 flex-1">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-2 sm:px-4">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-3xl sm:text-4xl font-black text-gray-800 tracking-tight">Identity Access Hub</h1>
                        <p className="text-sm font-medium text-gray-500">Manage all users, roles, and CSV imports.</p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <input type="file" id="csvInputStudent" accept=".csv" className="hidden" onChange={(e) => handleCSVUpload(e, 'student')} />
                        <input type="file" id="csvInputTeacher" accept=".csv" className="hidden" onChange={(e) => handleCSVUpload(e, 'teacher')} />
                        
                        <div className="flex bg-white/80 rounded-full shadow-sm border border-white overflow-hidden">
                            <button 
                                onClick={() => document.getElementById('csvInputStudent').click()}
                                disabled={isBulkImporting}
                                className="px-4 py-3.5 sm:py-4 bg-transparent hover:bg-gray-100/50 text-[10px] sm:text-xs font-black text-gray-600 uppercase tracking-widest transition-all border-r border-gray-200 flex items-center justify-center gap-2"
                            >
                                <Upload size={14} /> Students
                            </button>
                            <button 
                                onClick={() => document.getElementById('csvInputTeacher').click()}
                                disabled={isBulkImporting}
                                className="px-4 py-3.5 sm:py-4 bg-transparent hover:bg-gray-100/50 text-[10px] sm:text-xs font-black text-gray-600 uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                            >
                                <Upload size={14} /> Teachers
                            </button>
                        </div>
                        
                        <button onClick={handleAddNew} className="px-4 py-3.5 sm:py-4 rounded-full font-black tracking-widest text-[10px] sm:text-xs text-white shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0 bg-gradient-to-r from-[#FF8E75] to-[#FF5E8E] hover:shadow-[0_8px_20px_rgba(255,94,142,0.3)] flex items-center justify-center gap-2 uppercase">
                            <Plus size={14} /> Add System User
                        </button>
                    </div>
                </div>

                {/* Main Directory Area */}
                <div className="bg-[#EBEBEF] rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-[inset_0_2px_10px_rgba(255,255,255,0.9),0_10px_30px_rgba(0,0,0,0.05)] border border-white/40 flex flex-col">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 px-2 gap-4">
                        <div className="flex items-center text-gray-400 text-sm pl-4 w-full sm:w-64 bg-white/40 rounded-full py-2 shadow-sm border border-white">
                            <Search size={16} className="mr-2 shrink-0" />
                            <input 
                                type="text" 
                                placeholder="Search the directory..." 
                                className="bg-transparent outline-none placeholder-gray-400 text-gray-700 w-full font-medium" 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        
                        <div className="relative">
                            <select 
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="px-4 py-3 bg-white/60 backdrop-blur-sm rounded-full text-[10px] sm:text-[11px] font-black tracking-wider uppercase shadow-sm border border-white/50 text-gray-700 outline-none appearance-none pr-8 cursor-pointer hover:bg-white transition-colors"
                            >
                                <option value="all">All Access Tiers</option>
                                <option value="student">Student Level</option>
                                <option value="teacher">Teacher Level</option>
                                <option value="admin">Admin Level</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className="bg-white/30 p-2 sm:p-4 rounded-3xl border border-white/50 backdrop-blur-sm overflow-x-auto min-h-[400px]">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr>
                                    <th className="px-6 py-4 text-[10px] sm:text-[11px] font-black uppercase text-gray-500 tracking-widest border-b border-white/40">Identity Record</th>
                                    <th className="px-6 py-4 text-[10px] sm:text-[11px] font-black uppercase text-gray-500 tracking-widest border-b border-white/40">Authorization</th>
                                    <th className="px-6 py-4 text-[10px] sm:text-[11px] font-black uppercase text-gray-500 tracking-widest border-b border-white/40">Division</th>
                                    <th className="px-6 py-4 text-[10px] sm:text-[11px] font-black uppercase text-gray-500 tracking-widest border-b border-white/40">State</th>
                                    <th className="px-6 py-4 text-[10px] sm:text-[11px] font-black uppercase text-gray-500 tracking-widest border-b border-white/40 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoadingUsers ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-10 text-center text-sm font-medium text-gray-500">Retrieving intelligence...</td>
                                    </tr>
                                ) : filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-white/40 transition-colors border-b border-white/20 last:border-0 rounded-2xl overflow-hidden group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-200 shadow-inner flex items-center justify-center text-indigo-700 font-bold border border-white/60 shrink-0">
                                                    {user.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-black text-gray-800 tracking-tight">{user.name}</div>
                                                    <div className="text-[10px] sm:text-xs font-medium text-gray-500">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 bg-white/60 backdrop-blur-sm rounded-full text-[9px] font-black tracking-wider uppercase shadow-sm border border-white/50 ${
                                                user.role === 'admin' ? 'text-purple-700' :
                                                user.role === 'teacher' ? 'text-blue-700' :
                                                'text-green-700'
                                            }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-[10px] sm:text-xs font-black text-gray-600 tracking-wider">
                                            {user.assignedClass || 'Unassigned'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest flex items-center gap-1">
                                                <ShieldCheck size={14} /> {user.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEdit(user)} className="p-2 bg-white rounded-lg shadow-sm border border-white/40 text-gray-400 hover:text-indigo-600 hover:border-indigo-200 transition-colors">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(user.id)} className="p-2 bg-white rounded-lg shadow-sm border border-white/40 text-gray-400 hover:text-red-600 hover:border-red-200 transition-colors">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredUsers.length === 0 && !isLoadingUsers && (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-10 text-center text-sm font-medium text-gray-500">No identities match your criteria.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal - Kept functionally the same, but you could restyle Modal.jsx if needed. */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={<span className="text-2xl font-black text-gray-800 tracking-tight">{selectedUser ? "Modify Identity" : "Provision Identity"}</span>}
            >
                <form onSubmit={handleSaveUser} className="space-y-6">
                    <Input
                        label="Full Name"
                        name="userName"
                        defaultValue={selectedUser?.name || ''}
                        required
                    />
                    <Input
                        label="Email Address"
                        type="email"
                        name="userEmail"
                        defaultValue={selectedUser?.email || ''}
                        required
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col">
                            <label className="block text-sm font-bold text-gray-700 mb-1 tracking-wider uppercase text-[10px]">Authorization Role</label>
                            <select
                                name="userRole"
                                className="block w-full py-3 px-4 border border-gray-200 bg-gray-50 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-gray-700"
                                value={selectedRoleForModal}
                                onChange={(e) => setSelectedRoleForModal(e.target.value)}
                            >
                                <option value="student">Student</option>
                                <option value="teacher">Teacher</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <Input
                            label="Assignment / Section"
                            name="userClass"
                            defaultValue={selectedUser?.assignedClass || ''}
                            placeholder="e.g. CSE VIA"
                            disabled={selectedRoleForModal !== 'student'}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                        <button type="button" onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="px-6 py-3 rounded-full bg-gray-100 hover:bg-gray-200 text-xs font-black text-gray-600 uppercase tracking-widest transition-all">
                            Abort
                        </button>
                        <button type="submit" disabled={isSubmitting} className="px-6 py-3 rounded-full font-black tracking-widest text-[10px] sm:text-xs text-white shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0 bg-gradient-to-r from-[#FF8E75] to-[#FF5E8E] hover:shadow-[0_8px_20px_rgba(255,94,142,0.3)] uppercase">
                            {isSubmitting ? 'Syncing...' : 'Provision Now'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default UserManagement;
