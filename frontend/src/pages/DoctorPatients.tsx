import React, { useState, useEffect } from 'react';
import { Users, Search, Mail, Phone, Calendar, ArrowRight } from 'lucide-react';
import apiService from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import '../SereneWellness.css';

const DoctorPatients: React.FC = () => {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await apiService.getPatients();
        if (response.success) {
          setPatients(response.data || []);
        }
      } catch (error) {
        
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="glass-card p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl serene-title mb-2">Patient Profiles</h1>
          <p className="serene-subtitle text-lg">Manage recovery plans and clinical profiles for your connected patients.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input 
            type="text"
            placeholder="Search patients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 pr-6 py-3 rounded-2xl bg-white/50 border border-white focus:ring-2 focus:ring-violet-200 focus:outline-none w-full md:w-80 transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredPatients.length > 0 ? (
          filteredPatients.map((patient, idx) => (
            <div key={idx} className="glass-card p-6 group hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                  {patient.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 leading-tight">{patient.name}</h3>
                  <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest mt-1">Active Patient</p>
                </div>
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="h-4 w-4 mr-3 text-gray-400" />
                  {patient.email}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="h-4 w-4 mr-3 text-gray-400" />
                  Not provided
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-3 text-gray-400" />
                  Last Session: 2 days ago
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">In Compliance</span>
                </div>
                <button className="flex items-center gap-2 text-xs font-bold text-violet-600 hover:text-violet-700 transition-colors uppercase tracking-widest">
                  View Case
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center glass-card">
            <Users className="h-16 w-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900">No patients found</h3>
            <p className="serene-subtitle">Adjust your search or wait for new connections.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorPatients;
