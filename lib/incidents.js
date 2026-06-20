'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { generateId } from './utils';

const IncidentContext = createContext(null);

// Generate demo data
function generateDemoData() {
  const apps = ['Core Banking System', 'Mobile Banking', 'Internet Banking', 'ATM Gateway', 'Payment Gateway', 'SWIFT Messaging', 'RTGS System'];
  const departments = ['IT Operations', 'IT Infrastructure', 'IT Security', 'IT Development', 'Digital Banking'];
  const smes = ['Ahmad Faruq', 'Budi Santoso', 'Citra Dewi', 'Dimas Prasetyo', 'Eka Putri'];
  const platforms = ['AWS', 'On-Premise DC1', 'On-Premise DC2', 'Azure', 'GCP', 'Hybrid Cloud'];
  const severities = ['Low', 'Medium', 'High'];
  const statuses = ['Open', 'In Progress', 'Resolved', 'Closed'];
  const workflows = ['Draft', 'Pending Review', 'Approved'];

  const problems = [
    { detail: 'Database connection pool exhausted causing timeout errors pada query transaksi. Connection leak terdeteksi pada module batch processing.', root: 'Connection leak pada batch processing module yang tidak menutup koneksi setelah selesai.', action: 'Patch module batch processing untuk implement proper connection cleanup. Tambahkan connection pool monitoring.' },
    { detail: 'Service degradation pada API endpoint /transfer. Response time meningkat dari 200ms ke 5000ms. Terdeteksi high CPU usage pada application server.', root: 'Memory leak pada caching layer yang menyebabkan excessive garbage collection.', action: 'Restart service dan deploy hotfix untuk caching layer. Implementasi circuit breaker pattern.' },
    { detail: 'SSL certificate expired menyebabkan failure pada mutual TLS handshake dengan partner bank. Seluruh transaksi outgoing terhenti.', root: 'Certificate renewal tidak dilakukan tepat waktu karena monitoring alert tidak terkonfigurasi.', action: 'Renew SSL certificate segera. Setup automated certificate monitoring dan renewal reminder 30 hari sebelum expire.' },
    { detail: 'Disk space penuh pada database server (95% usage) menyebabkan write operation gagal. Transaction log tidak terpurge.', root: 'Scheduled job untuk purge transaction log older than 90 days tidak berjalan sejak maintenance window terakhir.', action: 'Purge old transaction logs, resize disk. Fix scheduled purge job dan tambahkan disk space alert threshold.' },
    { detail: 'Network latency spike antara application server dan database server. Packet loss 15% terdeteksi pada network monitoring.', root: 'Faulty network switch pada rack database server yang menyebabkan intermittent packet loss.', action: 'Replace faulty network switch. Implement network redundancy path dan enhance monitoring.' },
    { detail: 'Login failure massal pada mobile banking. Error "authentication service unavailable" muncul pada 70% request.', root: 'Redis session store mengalami out of memory karena session TTL tidak dikonfigurasi dengan benar.', action: 'Configure proper TTL untuk session data. Increase Redis memory allocation dan implement session cleanup job.' },
    { detail: 'Batch settlement process gagal pada T+1 reconciliation. Data mismatch antara core banking dan payment gateway.', root: 'Format timestamp berubah pada API version update payment gateway tanpa backward compatibility.', action: 'Implement timestamp format adapter. Koordinasi dengan vendor payment gateway untuk backward compatibility.' },
  ];

  const incidents = [];
  const now = new Date();

  for (let i = 0; i < 25; i++) {
    const daysAgo = Math.floor(Math.random() * 60);
    const problemDate = new Date(now);
    problemDate.setDate(problemDate.getDate() - daysAgo);

    const prob = problems[Math.floor(Math.random() * problems.length)];
    const sev = severities[Math.floor(Math.random() * severities.length)];
    const app = apps[Math.floor(Math.random() * apps.length)];

    const targetDate = new Date(problemDate);
    targetDate.setDate(targetDate.getDate() + Math.floor(Math.random() * 14) + 1);

    incidents.push({
      id: `INC-${String(i + 1).padStart(4, '0')}`,
      problem_date: problemDate.toISOString().split('T')[0],
      jam_incident: `${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
      aplikasi: app,
      aplikasi_terimpact: apps.filter(() => Math.random() > 0.7).filter(a => a !== app).slice(0, 3),
      lama_downtime: Math.floor(Math.random() * 300) + 5,
      severity: sev,
      nama_platform: platforms[Math.floor(Math.random() * platforms.length)],
      detail_problem: prob.detail,
      root_cause: prob.root,
      action_plan: prob.action,
      target_action_plan: targetDate.toISOString().split('T')[0],
      status_action_plan: statuses[Math.floor(Math.random() * statuses.length)],
      nama_sme: smes[Math.floor(Math.random() * smes.length)],
      nama_department: departments[Math.floor(Math.random() * departments.length)],
      workflow_status: workflows[Math.floor(Math.random() * workflows.length)],
      rejection_note: '',
      is_pinned: Math.random() > 0.85,
      created_by: 'usr-001',
      reviewed_by: Math.random() > 0.5 ? 'usr-002' : null,
      created_at: problemDate.toISOString(),
      updated_at: problemDate.toISOString(),
    });
  }

  return incidents;
}

function generateDemoAuditTrail(incidents) {
  const trails = [];
  incidents.forEach(inc => {
    trails.push({
      id: `AT-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      incident_id: inc.id,
      action: 'created',
      performed_by: inc.created_by,
      performer_name: 'Andi Pratama',
      details: { message: `Incident ${inc.id} dibuat` },
      created_at: inc.created_at,
    });
    if (inc.workflow_status === 'Approved') {
      trails.push({
        id: `AT-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
        incident_id: inc.id,
        action: 'approved',
        performed_by: 'usr-002',
        performer_name: 'Siti Rahayu',
        details: { message: `Incident ${inc.id} disetujui` },
        created_at: new Date(new Date(inc.created_at).getTime() + 3600000).toISOString(),
      });
    }
  });
  return trails;
}

export function IncidentProvider({ children }) {
  const [incidents, setIncidents] = useState([]);
  const [auditTrail, setAuditTrail] = useState([]);
  const [waSchedules, setWaSchedules] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const storedInc = localStorage.getItem('remittance_incidents');
    const storedAudit = localStorage.getItem('remittance_audit');
    const storedWa = localStorage.getItem('remittance_wa_schedules');

    if (storedInc) {
      setIncidents(JSON.parse(storedInc));
      setAuditTrail(storedAudit ? JSON.parse(storedAudit) : []);
      setWaSchedules(storedWa ? JSON.parse(storedWa) : []);
    } else {
      const demoIncidents = generateDemoData();
      const demoAudit = generateDemoAuditTrail(demoIncidents);
      setIncidents(demoIncidents);
      setAuditTrail(demoAudit);
      localStorage.setItem('remittance_incidents', JSON.stringify(demoIncidents));
      localStorage.setItem('remittance_audit', JSON.stringify(demoAudit));
    }
    setLoaded(true);
  }, []);

  const persist = useCallback((incs, audit, wa) => {
    localStorage.setItem('remittance_incidents', JSON.stringify(incs));
    localStorage.setItem('remittance_audit', JSON.stringify(audit));
    if (wa) localStorage.setItem('remittance_wa_schedules', JSON.stringify(wa));
  }, []);

  const createIncident = useCallback((data, userId, userName) => {
    const newInc = {
      ...data,
      id: generateId(),
      workflow_status: 'Draft',
      rejection_note: '',
      is_pinned: false,
      created_by: userId,
      reviewed_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const newAudit = {
      id: `AT-${Date.now().toString(36)}`,
      incident_id: newInc.id,
      action: 'created',
      performed_by: userId,
      performer_name: userName,
      details: { message: `Incident ${newInc.id} dibuat oleh ${userName}` },
      created_at: new Date().toISOString(),
    };
    const updatedIncs = [newInc, ...incidents];
    const updatedAudit = [newAudit, ...auditTrail];
    setIncidents(updatedIncs);
    setAuditTrail(updatedAudit);
    persist(updatedIncs, updatedAudit);
    return newInc;
  }, [incidents, auditTrail, persist]);

  const updateIncident = useCallback((id, data, userId, userName) => {
    const updatedIncs = incidents.map(inc =>
      inc.id === id ? { ...inc, ...data, updated_at: new Date().toISOString() } : inc
    );
    const newAudit = {
      id: `AT-${Date.now().toString(36)}`,
      incident_id: id,
      action: 'edited',
      performed_by: userId,
      performer_name: userName,
      details: { message: `Incident ${id} diperbarui oleh ${userName}` },
      created_at: new Date().toISOString(),
    };
    const updatedAudit = [newAudit, ...auditTrail];
    setIncidents(updatedIncs);
    setAuditTrail(updatedAudit);
    persist(updatedIncs, updatedAudit);
  }, [incidents, auditTrail, persist]);

  const submitForReview = useCallback((id, userId, userName) => {
    const updatedIncs = incidents.map(inc =>
      inc.id === id ? { ...inc, workflow_status: 'Pending Review', updated_at: new Date().toISOString() } : inc
    );
    const newAudit = {
      id: `AT-${Date.now().toString(36)}`,
      incident_id: id,
      action: 'submitted',
      performed_by: userId,
      performer_name: userName,
      details: { message: `Incident ${id} diajukan untuk review oleh ${userName}` },
      created_at: new Date().toISOString(),
    };
    const updatedAudit = [newAudit, ...auditTrail];
    setIncidents(updatedIncs);
    setAuditTrail(updatedAudit);
    persist(updatedIncs, updatedAudit);
  }, [incidents, auditTrail, persist]);

  const approveIncident = useCallback((id, userId, userName) => {
    const updatedIncs = incidents.map(inc =>
      inc.id === id ? { ...inc, workflow_status: 'Approved', reviewed_by: userId, updated_at: new Date().toISOString() } : inc
    );
    const newAudit = {
      id: `AT-${Date.now().toString(36)}`,
      incident_id: id,
      action: 'approved',
      performed_by: userId,
      performer_name: userName,
      details: { message: `Incident ${id} disetujui oleh ${userName}` },
      created_at: new Date().toISOString(),
    };
    const updatedAudit = [newAudit, ...auditTrail];
    setIncidents(updatedIncs);
    setAuditTrail(updatedAudit);
    persist(updatedIncs, updatedAudit);
  }, [incidents, auditTrail, persist]);

  const rejectIncident = useCallback((id, note, userId, userName) => {
    const updatedIncs = incidents.map(inc =>
      inc.id === id ? { ...inc, workflow_status: 'Rejected', rejection_note: note, reviewed_by: userId, updated_at: new Date().toISOString() } : inc
    );
    const newAudit = {
      id: `AT-${Date.now().toString(36)}`,
      incident_id: id,
      action: 'rejected',
      performed_by: userId,
      performer_name: userName,
      details: { message: `Incident ${id} ditolak oleh ${userName}: ${note}` },
      created_at: new Date().toISOString(),
    };
    const updatedAudit = [newAudit, ...auditTrail];
    setIncidents(updatedIncs);
    setAuditTrail(updatedAudit);
    persist(updatedIncs, updatedAudit);
  }, [incidents, auditTrail, persist]);

  const togglePin = useCallback((id, userId, userName) => {
    const inc = incidents.find(i => i.id === id);
    if (!inc) return;
    const updatedIncs = incidents.map(i =>
      i.id === id ? { ...i, is_pinned: !i.is_pinned, updated_at: new Date().toISOString() } : i
    );
    const newAudit = {
      id: `AT-${Date.now().toString(36)}`,
      incident_id: id,
      action: inc.is_pinned ? 'unpinned' : 'pinned',
      performed_by: userId,
      performer_name: userName,
      details: { message: `Incident ${id} ${inc.is_pinned ? 'di-unpin' : 'di-pin'} oleh ${userName}` },
      created_at: new Date().toISOString(),
    };
    const updatedAudit = [newAudit, ...auditTrail];
    setIncidents(updatedIncs);
    setAuditTrail(updatedAudit);
    persist(updatedIncs, updatedAudit);
  }, [incidents, auditTrail, persist]);

  const saveWaSchedule = useCallback((schedule) => {
    const updated = schedule.id
      ? waSchedules.map(s => s.id === schedule.id ? { ...schedule, updated_at: new Date().toISOString() } : s)
      : [{ ...schedule, id: `WA-${Date.now().toString(36)}`, created_at: new Date().toISOString() }, ...waSchedules];
    setWaSchedules(updated);
    persist(incidents, auditTrail, updated);
  }, [incidents, auditTrail, waSchedules, persist]);

  const deleteWaSchedule = useCallback((id) => {
    const updated = waSchedules.filter(s => s.id !== id);
    setWaSchedules(updated);
    persist(incidents, auditTrail, updated);
  }, [incidents, auditTrail, waSchedules, persist]);

  return (
    <IncidentContext.Provider value={{
      incidents, auditTrail, waSchedules, loaded,
      createIncident, updateIncident, submitForReview,
      approveIncident, rejectIncident, togglePin,
      saveWaSchedule, deleteWaSchedule,
    }}>
      {children}
    </IncidentContext.Provider>
  );
}

export function useIncidents() {
  const ctx = useContext(IncidentContext);
  if (!ctx) throw new Error('useIncidents must be inside IncidentProvider');
  return ctx;
}
