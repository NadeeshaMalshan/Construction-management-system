import { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
  addMilestone,
  assignEmployeeProjects,
  createEmployee,
  createExpense,
  createInquiry,
  createProject,
  createTask,
  deleteExpense,
  deleteInquiry,
  deleteProject,
  formatDate,
  formatMoney,
  getAllEmployees,
  getClients,
  getExpenses,
  getInquiries,
  getContracts,
  getProjectManagementSummary,
  getProjects,
  getTasks,
  getForwardedProjectRequests,
  getProjectRequests,
  pmReplyProjectRequest,
  approveProjectRequest,
  rejectProjectRequest,
  sendProjectRequestResponseToClient,
  sendInquiryMessage,
  startProjectFromRequest,
  submitInquiryDecision,
  linkInquiryProject,
  uploadDocument,
  updateProject,
  updateTask,
} from '../services/api';
import { downloadFile, exportCsv, generateProjectDetailsPdf } from '../utils/documentDownload';
import InquiryThread from '../components/InquiryThread';

const statuses = ['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'];

const readImageAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(new Error('Unable to read the selected file.'));
  reader.readAsDataURL(file);
});

const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const emptyProject = {
  name: '',
  description: '',
  category: '',
  clientId: '',
  location: '',
  startDate: '',
  endDate: '',
  budget: '',
  status: '',
  progressPercentage: '',
  imageUrl: '',
  specifications: '',
  constructionStatus: '',
  priceRange: '',
};

const emptyTask = {
  taskName: '',
  description: '',
  assignedEmployeeId: '',
  startDate: '',
  deadline: '',
  status: 'TODO',
};

const emptyMilestone = {
  title: '',
  description: '',
  targetDate: '',
  status: '',
  progressPercentage: '',
};

const emptyExpense = {
  description: '',
  amount: '',
  date: '',
};

const Status = ({ value }) => (
  <span className={`pm-status ${String(value || '').toLowerCase().replaceAll('_', '-')}`}>
    {String(value || '').replaceAll('_', ' ')}
  </span>
);

export default function ProjectManagerDashboard() {
  const [tab, setTab] = useState('overview');
  const [clientReqSubTab, setClientReqSubTab] = useState('inquiries');
  const [summary, setSummary] = useState({});
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [expenses, setExpenses] = useState([]);

  // Selected project context for detail segments (Tasks, Milestones, Expenses, Team)
  const [selectedProjectId, setSelectedProjectId] = useState('');

  // Direct Client Inquiries (Direct PM-Client Flow)
  const [inquiries, setInquiries] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [pendingCreationInquiry, setPendingCreationInquiry] = useState(null);
  const [inquiryFilterStatus, setInquiryFilterStatus] = useState('ALL');
  const [inquiryProjectFilter, setInquiryProjectFilter] = useState('');
  const [inquiryClientFilter, setInquiryClientFilter] = useState('');
  const [inquirySearch, setInquirySearch] = useState('');
  const [pmReplyingInquiryId, setPmReplyingInquiryId] = useState(null);
  const [pmReplyText, setPmReplyText] = useState('');
  const [sendingPmReply, setSendingPmReply] = useState(false);
  const [composeInquiryOpen, setComposeInquiryOpen] = useState(false);
  const [composeInquiryForm, setComposeInquiryForm] = useState({
    clientId: '',
    projectId: '',
    subject: '',
    message: '',
  });
  const [sendingComposeInquiry, setSendingComposeInquiry] = useState(false);

  // Forms
  const [projectForm, setProjectForm] = useState(emptyProject);
  const [taskForm, setTaskForm] = useState(emptyTask);
  const [milestoneForm, setMilestoneForm] = useState(emptyMilestone);
  const [expenseForm, setExpenseForm] = useState(emptyExpense);
  const [employeeForm, setEmployeeForm] = useState({ name: '', email: '', role: '' });
  const [editingProject, setEditingProject] = useState(null);
  const [projectFilterCategory, setProjectFilterCategory] = useState('ALL');
  const [projectSearchQuery, setProjectSearchQuery] = useState('');

  // Client Assignment state
  const [clientAssignProject, setClientAssignProject] = useState('');
  const [clientAssignClient, setClientAssignClient] = useState('');
  const [savingClientAssign, setSavingClientAssign] = useState(false);

  // Employee Assignment state
  const [selectedEmpForAssign, setSelectedEmpForAssign] = useState(null);
  const [assignedProjectIds, setAssignedProjectIds] = useState([]);
  const [savingEmpAssign, setSavingEmpAssign] = useState(false);

  // Client Custom Project Requests (Forwarded by Client Manager / Direct PM)
  const [forwardedRequests, setForwardedRequests] = useState([]);
  const [customFilterStatus, setCustomFilterStatus] = useState('ALL');
  const [customFilterClient, setCustomFilterClient] = useState('ALL');
  const [customSearchQuery, setCustomSearchQuery] = useState('');

  const [pmReplyModalOpen, setPmReplyModalOpen] = useState(false);
  const [pmReplyTarget, setPmReplyTarget] = useState(null);
  const [pmReplyForm, setPmReplyForm] = useState({
    pmReply: '',
    pmEstimatedBudget: '',
    pmEstimatedDuration: '',
  });
  const [submittingPmReply, setSubmittingPmReply] = useState(false);
  const [pmPreviewPhotosModal, setPmPreviewPhotosModal] = useState(null);

  // PM Approve Custom Design Modal State
  const [pmApproveModalOpen, setPmApproveModalOpen] = useState(false);
  const [pmApproveTarget, setPmApproveTarget] = useState(null);
  const [pmApproveForm, setPmApproveForm] = useState({
    pmEstimatedBudget: '',
    pmEstimatedDuration: '6 - 8 Months',
    pmReply: '',
    clientMessage: '',
  });
  const [submittingPmApprove, setSubmittingPmApprove] = useState(false);

  // PM Reject Custom Design Modal State
  const [pmRejectModalOpen, setPmRejectModalOpen] = useState(false);
  const [pmRejectTarget, setPmRejectTarget] = useState(null);
  const [pmRejectReason, setPmRejectReason] = useState('');
  const [submittingPmReject, setSubmittingPmReject] = useState(false);

  // PM Down Payment Message / Reminder Modal State
  const [pmDownPaymentMsgModalOpen, setPmDownPaymentMsgModalOpen] = useState(false);
  const [pmDownPaymentMsgTarget, setPmDownPaymentMsgTarget] = useState(null);
  const [pmDownPaymentMsg, setPmDownPaymentMsg] = useState('');
  const [submittingPmDownPaymentMsg, setSubmittingPmDownPaymentMsg] = useState(false);

  // PM Inquiry Decision State
  const [inquiryDecisionModalOpen, setInquiryDecisionModalOpen] = useState(false);
  const [inquiryDecisionTarget, setInquiryDecisionTarget] = useState(null);
  const [inquiryDecisionForm, setInquiryDecisionForm] = useState({
    decision: 'APPROVED',
    decisionRemarks: '',
    estimatedBudget: '',
    estimatedDuration: '8 - 10 Months',
  });
  const [submittingInquiryDecision, setSubmittingInquiryDecision] = useState(false);

  // Start Project from Approved Request Modal
  const [startProjectModalOpen, setStartProjectModalOpen] = useState(false);
  const [startProjectTarget, setStartProjectTarget] = useState(null);
  const [startProjectForm, setStartProjectForm] = useState({
    name: '',
    description: '',
    category: '',
    location: '',
    budget: '',
    startDate: '',
    endDate: '',
  });
  const [startingProject, setStartingProject] = useState(false);
  const [startProjectModalError, setStartProjectModalError] = useState('');

  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const refresh = async () => {
    try {
      const results = await Promise.allSettled([
        getProjectManagementSummary(),
        getProjects({ realOnly: true }),
        getClients(),
        getAllEmployees(),
        getTasks(),
        getExpenses(),
        getProjectRequests(),
        getInquiries(),
        getContracts(),
      ]);

      const [sumRes, projRes, clientRes, empRes, taskRes, expRes, reqRes, inqRes, conRes] = results;
      const nextSummary = sumRes.status === 'fulfilled' ? sumRes.value : {};
      const nextProjects = projRes.status === 'fulfilled' ? projRes.value || [] : [];
      const nextClients = clientRes.status === 'fulfilled' ? clientRes.value || [] : [];
      const nextEmployees = empRes.status === 'fulfilled' ? empRes.value || [] : [];
      const nextTasks = taskRes.status === 'fulfilled' ? taskRes.value || [] : [];
      const nextExpenses = expRes.status === 'fulfilled' ? expRes.value || [] : [];
      const nextRequests = reqRes.status === 'fulfilled' ? reqRes.value || [] : [];
      const nextInquiries = inqRes.status === 'fulfilled' ? inqRes.value || [] : [];
      const nextContracts = conRes.status === 'fulfilled' ? conRes.value || [] : [];

      setSummary(nextSummary || {});
      setProjects(nextProjects);
      setClients(nextClients);
      setEmployees(nextEmployees);
      setTasks(nextTasks);
      setExpenses(nextExpenses);
      setForwardedRequests(nextRequests);
      setInquiries(nextInquiries);
      setContracts(nextContracts);

      if (!selectedProjectId && nextProjects.length > 0) {
        setSelectedProjectId(String(nextProjects[0].id));
      }
      setError('');
    } catch (err) {
      setError(err.message || 'Unable to load project management data.');
    }
  };

  const handleOpenPmReplyModal = (request) => {
    setPmReplyTarget(request);
    setPmReplyForm({
      pmReply: request.pmReply || '',
      pmEstimatedBudget: request.pmEstimatedBudget ? String(request.pmEstimatedBudget) : (request.expectedBudget ? String(request.expectedBudget) : ''),
      pmEstimatedDuration: request.pmEstimatedDuration || '8 - 10 Months',
    });
    setPmReplyModalOpen(true);
  };

  const handleSubmitPmReply = async (e) => {
    e.preventDefault();
    if (!pmReplyTarget || !pmReplyForm.pmReply.trim()) return;
    setSubmittingPmReply(true);
    setError('');
    try {
      await pmReplyProjectRequest(pmReplyTarget.id, {
        pmReply: pmReplyForm.pmReply.trim(),
        pmEstimatedBudget: pmReplyForm.pmEstimatedBudget ? Number(pmReplyForm.pmEstimatedBudget) : null,
        pmEstimatedDuration: pmReplyForm.pmEstimatedDuration.trim() || null,
        pmRespondedBy: 'Project Manager',
      });
      setNotice(`Engineering assessment & reply submitted for "${pmReplyTarget.title}". Transmitted to Client Manager.`);
      setPmReplyModalOpen(false);
      setPmReplyTarget(null);
      await refresh();
      setTimeout(() => setNotice(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to submit PM reply');
    } finally {
      setSubmittingPmReply(false);
    }
  };

  const customRequests = useMemo(() => {
    return forwardedRequests.filter((r) => r.isCustomDesign || !r.selectedDesign);
  }, [forwardedRequests]);

  const catalogRequests = useMemo(() => {
    return forwardedRequests.filter((r) => !r.isCustomDesign && r.selectedDesign);
  }, [forwardedRequests]);

  const customPendingCount = useMemo(() => {
    return customRequests.filter((r) => r.status === 'PENDING_PM_REVIEW' || r.status === 'FORWARDED_TO_PM').length;
  }, [customRequests]);

  const catalogPendingCount = useMemo(() => {
    return catalogRequests.filter((r) => r.status === 'PENDING_PM_REVIEW' || r.status === 'FORWARDED_TO_PM' || r.status === 'PENDING_CM_REVIEW').length;
  }, [catalogRequests]);

  const pendingInquiriesList = useMemo(() => {
    return inquiries.filter(
      (inq) => inq.status === 'PENDING' && inq.pmDecision !== 'APPROVED' && inq.pmDecision !== 'REJECTED'
    );
  }, [inquiries]);

  const totalCombinedRequestsCount = useMemo(() => {
    return customRequests.length + inquiries.length + catalogRequests.length;
  }, [customRequests.length, inquiries.length, catalogRequests.length]);

  const totalCombinedPendingCount = useMemo(() => {
    return customPendingCount + inquiries.filter((i) => i.status === 'PENDING').length + catalogPendingCount;
  }, [customPendingCount, inquiries, catalogPendingCount]);

  const signedInquiriesAwaitingProject = useMemo(() => {
    return inquiries.filter(
      (inq) => ((inq.pmDecision === 'APPROVED' && inq.contractGenerated) || inq.downPaymentPaid) && !inq.project
    );
  }, [inquiries]);

  const handleOpenPmApproveModal = (req) => {
    setPmApproveTarget(req);
    const budget = req.pmEstimatedBudget
      ? String(req.pmEstimatedBudget)
      : (req.expectedBudget ? String(req.expectedBudget) : '');
    const duration = req.pmEstimatedDuration || '6 - 8 Months';
    const clientName = req.client?.name || 'Valued Client';
    setPmApproveForm({
      pmEstimatedBudget: budget,
      pmEstimatedDuration: duration,
      pmReply: req.pmReply || 'Technical blueprints and architectural drawings reviewed and approved for construction.',
      clientMessage: `Dear ${clientName},\n\nWe are pleased to inform you that your custom design project request for "${req.title}" has been reviewed and officially APPROVED by the Project Manager!\n\n• Estimated Construction Budget: LKR ${budget ? Number(budget).toLocaleString() : 'N/A'}\n• Estimated Construction Timeline: ${duration}\n\nPlease proceed to make your initial down payment (approx. 20%) to confirm your project and initiate construction scheduling.`,
    });
    setPmApproveModalOpen(true);
  };

  const handleSubmitPmApprove = async (e) => {
    e.preventDefault();
    if (!pmApproveTarget) return;
    setSubmittingPmApprove(true);
    setError('');
    try {
      await approveProjectRequest(pmApproveTarget.id, {
        approvedBy: 'Project Manager',
        pmEstimatedBudget: pmApproveForm.pmEstimatedBudget ? Number(pmApproveForm.pmEstimatedBudget) : null,
        pmEstimatedDuration: pmApproveForm.pmEstimatedDuration.trim() || null,
        pmReply: pmApproveForm.pmReply.trim() || null,
        clientMessage: pmApproveForm.clientMessage.trim(),
      });
      setNotice(`Custom design project "${pmApproveTarget.title}" approved! Client notified with down payment instructions.`);
      setPmApproveModalOpen(false);
      setPmApproveTarget(null);
      await refresh();
      setTimeout(() => setNotice(''), 5000);
    } catch (err) {
      setError(err.message || 'Failed to approve custom project request');
    } finally {
      setSubmittingPmApprove(false);
    }
  };

  const handleOpenPmRejectModal = (req) => {
    setPmRejectTarget(req);
    setPmRejectReason(req.rejectionReason || 'Project architectural parameters or site constraints currently do not meet structural feasibility criteria.');
    setPmRejectModalOpen(true);
  };

  const handleSubmitPmReject = async (e) => {
    e.preventDefault();
    if (!pmRejectTarget || !pmRejectReason.trim()) return;
    setSubmittingPmReject(true);
    setError('');
    try {
      await rejectProjectRequest(pmRejectTarget.id, {
        rejectedBy: 'Project Manager',
        reason: pmRejectReason.trim(),
      });
      setNotice(`Custom design request "${pmRejectTarget.title}" rejected. Client notified.`);
      setPmRejectModalOpen(false);
      setPmRejectTarget(null);
      await refresh();
      setTimeout(() => setNotice(''), 5000);
    } catch (err) {
      setError(err.message || 'Failed to reject project request');
    } finally {
      setSubmittingPmReject(false);
    }
  };

  const handleOpenPmDownPaymentMsgModal = (req) => {
    setPmDownPaymentMsgTarget(req);
    const budget = req.pmEstimatedBudget ? Number(req.pmEstimatedBudget) : (req.expectedBudget ? Number(req.expectedBudget) : 0);
    const dpAmount = budget > 0 ? (budget * 0.2) : 0;
    const clientName = req.client?.name || 'Valued Client';
    setPmDownPaymentMsg(
      `Dear ${clientName},\n\nThis is a notification regarding your approved custom project "${req.title}".\n\nPlease proceed to submit your initial down payment${dpAmount > 0 ? ` (approx. LKR ${dpAmount.toLocaleString()})` : ''} via Bank Transfer or Online Card Payment under the Payment section in your portal to initiate site mobilization and begin architectural drafting.\n\nThank you,\nProject Management Team`
    );
    setPmDownPaymentMsgModalOpen(true);
  };

  const handleSubmitPmDownPaymentMsg = async (e) => {
    e.preventDefault();
    if (!pmDownPaymentMsgTarget || !pmDownPaymentMsg.trim()) return;
    setSubmittingPmDownPaymentMsg(true);
    setError('');
    try {
      await sendProjectRequestResponseToClient(pmDownPaymentMsgTarget.id, pmDownPaymentMsg.trim(), 'Project Manager');
      setNotice(`Down payment instruction message sent to client ${pmDownPaymentMsgTarget.client?.name || ''}!`);
      setPmDownPaymentMsgModalOpen(false);
      setPmDownPaymentMsgTarget(null);
      await refresh();
      setTimeout(() => setNotice(''), 5000);
    } catch (err) {
      setError(err.message || 'Failed to send down payment message');
    } finally {
      setSubmittingPmDownPaymentMsg(false);
    }
  };

  const handleOpenInquiryDecisionModal = (inquiry, defaultDecision = 'APPROVED') => {
    setInquiryDecisionTarget(inquiry);
    const existingRemarks = inquiry.pmDecisionRemarks || (defaultDecision === 'APPROVED' 
      ? 'Structural & engineering feasibility verified. Specifications, site requirements, and architectural scope meet Odiliya standards.'
      : 'Site parameters or design constraints currently incompatible with engineering requirements.');
    setInquiryDecisionForm({
      decision: defaultDecision,
      decisionRemarks: existingRemarks,
      estimatedBudget: inquiry.pmEstimatedBudget ? String(inquiry.pmEstimatedBudget) : (inquiry.project?.budget ? String(inquiry.project.budget) : '15000000'),
      estimatedDuration: inquiry.pmEstimatedDuration || '8 - 10 Months',
    });
    setInquiryDecisionModalOpen(true);
  };

  const handleSubmitInquiryDecision = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.stopPropagation) e.stopPropagation();
    if (!inquiryDecisionTarget) return;
    setSubmittingInquiryDecision(true);
    try {
      const dec = inquiryDecisionForm.decision || 'APPROVED';
      const defaultRemarks = dec === 'APPROVED'
        ? 'Structural & engineering feasibility verified. Specifications, site requirements, and architectural scope meet Odiliya standards.'
        : 'Site parameters or design constraints currently incompatible with engineering requirements.';
      const remarks = (inquiryDecisionForm.decisionRemarks || '').trim() || defaultRemarks;
      const budgetVal = dec === 'APPROVED' && inquiryDecisionForm.estimatedBudget ? Number(inquiryDecisionForm.estimatedBudget) : null;
      const durationVal = dec === 'APPROVED' ? (inquiryDecisionForm.estimatedDuration || '8 - 10 Months').trim() : '';

      const payload = {
        decision: dec,
        decisionRemarks: remarks,
        estimatedBudget: budgetVal,
        estimatedDuration: durationVal,
        decidedBy: 'Project Manager',
      };

      const updatedInq = await submitInquiryDecision(inquiryDecisionTarget.id, payload);

      setInquiries((prev) =>
        prev.map((item) =>
          item.id === inquiryDecisionTarget.id
            ? {
                ...item,
                pmDecision: dec,
                pmDecisionDate: new Date().toISOString(),
                pmDecisionRemarks: remarks,
                pmEstimatedBudget: budgetVal,
                pmEstimatedDuration: durationVal,
                status: dec,
                ...(updatedInq && typeof updatedInq === 'object' ? updatedInq : {}),
              }
            : item
        )
      );

      try {
        localStorage.setItem('odiliya-inquiries-timestamp', String(Date.now()));
        window.dispatchEvent(new CustomEvent('odiliya-inquiry-replied', { detail: inquiryDecisionTarget.id }));
      } catch (_) {}

      report(`Technical feasibility decision [${dec}] registered for "${inquiryDecisionTarget.subject}". Transmitted to Client Manager.`);
      setInquiryDecisionModalOpen(false);
      setInquiryDecisionTarget(null);
      await refresh();
    } catch (err) {
      fail(err);
    } finally {
      setSubmittingInquiryDecision(false);
    }
  };

  const handleOpenStartProjectModal = (request) => {
    setStartProjectTarget(request);
    setStartProjectModalError('');
    const budgetVal = request.pmEstimatedBudget || request.expectedBudget || 1000000;
    const startVal = request.targetStartDate ? request.targetStartDate.slice(0, 10) : new Date().toISOString().slice(0, 10);
    setStartProjectForm({
      name: request.title,
      description: request.description || '',
      category: request.category || 'RESIDENCIES',
      location: request.location || '',
      budget: String(budgetVal),
      startDate: startVal,
      endDate: '',
    });
    setStartProjectModalOpen(true);
  };

  const handleConfirmStartProject = async (e) => {
    e.preventDefault();
    if (!startProjectTarget) return;
    setStartingProject(true);
    setError('');
    setStartProjectModalError('');

    if (!startProjectForm.name?.trim()) {
      setStartProjectModalError('Project Name is required.');
      setStartingProject(false);
      return;
    }
    const bNum = Number(startProjectForm.budget);
    if (!bNum || bNum <= 0) {
      setStartProjectModalError('Please enter a valid positive project budget.');
      setStartingProject(false);
      return;
    }
    if (!startProjectForm.startDate) {
      setStartProjectModalError('Project Start Date is required.');
      setStartingProject(false);
      return;
    }
    if (startProjectForm.endDate && startProjectForm.endDate < startProjectForm.startDate) {
      setStartProjectModalError('Estimated Completion Date must be on or after Start Date.');
      setStartingProject(false);
      return;
    }

    try {
      const payload = {
        name: startProjectForm.name.trim(),
        description: (startProjectForm.description || '').trim(),
        category: startProjectForm.category || 'RESIDENCIES',
        location: (startProjectForm.location || '').trim(),
        budget: bNum,
        startDate: startProjectForm.startDate,
        endDate: startProjectForm.endDate || null,
        status: 'IN_PROGRESS',
        imageUrls: startProjectTarget.imageUrls || [],
      };
      const createdProj = await startProjectFromRequest(startProjectTarget.id, payload, 'Project Manager');
      setNotice(`Project "${startProjectForm.name}" successfully started and assigned to client ${startProjectTarget.client?.name || 'Client'}!`);
      setStartProjectModalOpen(false);
      setStartProjectTarget(null);
      await refresh();
      if (createdProj && createdProj.id) {
        setSelectedProjectId(String(createdProj.id));
      }
      setTab('projects');
      setTimeout(() => setNotice(''), 5000);
    } catch (err) {
      const msg = err.message || 'Failed to start and assign project';
      setError(msg);
      setStartProjectModalError(msg);
    } finally {
      setStartingProject(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (selectedEmpForAssign && employees.length > 0) {
      const updated = employees.find((e) => e.id === selectedEmpForAssign.id);
      if (updated) {
        setSelectedEmpForAssign(updated);
      }
    }
  }, [employees]);

  const spentByProject = useMemo(() => {
    return expenses.reduce((totals, expense) => {
      const pid = expense.project?.id;
      if (pid) {
        totals[pid] = (totals[pid] || 0) + Number(expense.amount || 0);
      }
      return totals;
    }, {});
  }, [expenses]);

  const report = (message) => {
    setNotice(message);
    setError('');
  };

  const fail = (err) => {
    setError(err.message || 'Unable to save changes.');
    setNotice('');
  };

  const activeProject = projects.find((p) => String(p.id) === String(selectedProjectId)) || projects[0];

  const projectTasks = tasks.filter((task) => String(task.project?.id) === String(activeProject?.id));
  const projectExpenses = expenses.filter((expense) => String(expense.project?.id) === String(activeProject?.id));
  const projectEmployees = employees.filter((emp) => {
    if (emp.project && String(emp.project.id) === String(activeProject?.id)) return true;
    if (emp.assignedProjects && emp.assignedProjects.some((p) => String(p.id) === String(activeProject?.id))) return true;
    return false;
  });

  const startProject = () => {
    setEditingProject(null);
    setProjectForm(emptyProject);
    setTab('projects');
  };

  const editProject = (project) => {
    setEditingProject(project);
    setProjectForm({
      ...emptyProject,
      ...project,
      clientId: project.client?.id || '',
      imageUrl: project.imageUrl || '',
      specifications: project.specifications || '',
      constructionStatus: project.constructionStatus || '',
      priceRange: project.priceRange || '',
    });
    setSelectedProjectId(String(project.id));
    setTab('projects');
  };

  const handleCreateProjectFromSignedContract = (inq) => {
    const contract = contracts.find((c) => c.id === inq.contractId) || contracts.find((c) => c.client?.id === inq.client?.id);
    const projName = inq.design
      ? inq.design.name
      : (inq.subject ? inq.subject.replace(/^(Catalog Design Inquiry:\s*|Customized Design Inquiry:\s*|Company Design Inquiry:\s*|Inquiry:\s*)/i, '').trim() : 'Client Construction Project');

    const desc = inq.message || contract?.terms || 'Internal construction project initialized from signed contract.';
    const cat = inq.design?.category || 'RESIDENCIES';
    const cliId = inq.client?.id ? String(inq.client.id) : (contract?.client?.id ? String(contract.client.id) : '');
    const loc = inq.design?.location || 'Colombo, Sri Lanka';
    const bud = contract?.amount ? String(contract.amount) : (inq.pmEstimatedBudget ? String(inq.pmEstimatedBudget) : (inq.design?.budget ? String(inq.design.budget) : '15000000'));
    const sDate = contract?.signedDate || new Date().toISOString().slice(0, 10);
    const eDate = contract?.endDate || '';
    const imgUrl = inq.design?.imageUrl || inq.attachmentData || '';
    const specs = inq.design?.specifications || '';
    const constStatus = contract ? `Contract Signed (#${contract.contractNumber || contract.id})` : 'Contract Signed';
    const pRange = contract?.amount ? `LKR ${Number(contract.amount).toLocaleString()}` : '';

    setEditingProject(null);
    setProjectForm({
      name: projName,
      category: cat,
      clientId: cliId,
      location: loc,
      description: desc,
      imageUrl: imgUrl,
      specifications: specs,
      constructionStatus: constStatus,
      priceRange: pRange,
      startDate: sDate,
      endDate: eDate,
      budget: bud,
      status: 'IN_PROGRESS',
      progressPercentage: '0',
    });

    setPendingCreationInquiry(inq);
    setTab('projects');
    report(`Project creation form pre-filled with client, design, inquiry, and contract #${contract?.contractNumber || inq.contractId || ''} details. Review and click "Create project" to confirm.`);
  };

  const saveProject = async (event) => {
    event.preventDefault();
    const payload = {
      ...projectForm,
      budget: Number(projectForm.budget || 0),
      progressPercentage: Number(projectForm.progressPercentage || 0),
      marketingDesign: false,
      addedBy: editingProject?.addedBy || 'PROJECT_MANAGER',
      client: projectForm.clientId ? { id: Number(projectForm.clientId) } : null,
    };
    delete payload.clientId;

    try {
      const saved = editingProject
        ? await updateProject(editingProject.id, payload)
        : await createProject(payload);

      // If created from signed contract / inquiry workflow
      if (!editingProject) {
        if (pendingCreationInquiry) {
          try {
            await linkInquiryProject(pendingCreationInquiry.id, saved.id);
          } catch (linkErr) {
            console.warn('Could not link inquiry to project:', linkErr);
          }
        }

        // Requirement 7: Generate one document for that project
        try {
          await uploadDocument({
            title: `Project Charter & Contract Agreement - ${saved.name}`,
            documentType: 'CONTRACT_DEED',
            fileName: `Odiliya_Project_Charter_${saved.id}.pdf`,
            fileType: 'application/pdf',
            fileSize: '1.2 MB',
            fileData: saved.imageUrl || null,
            uploadedByRole: 'PROJECT_MANAGER',
            client: saved.client || (payload.client ? { id: payload.client.id } : null),
            project: { id: saved.id },
            description: `Official project charter and execution deed generated automatically for ${saved.name}.`,
          });
        } catch (docErr) {
          console.warn('Could not auto-create project document record:', docErr);
        }

        try {
          await generateProjectDetailsPdf(saved, {
            client: saved.client,
            tasks: [],
            milestones: [],
            expenses: [],
            employees: [],
            spent: 0,
            pmName: 'Project Manager (Operations & Civil Engineering)',
          });
        } catch (pdfErr) {
          console.warn('Could not auto-generate project dossier PDF:', pdfErr);
        }

        setPendingCreationInquiry(null);
      }

      setEditingProject(saved);
      setSelectedProjectId(String(saved.id));
      setProjectForm({ ...saved, clientId: saved.client?.id || '' });
      report(editingProject ? 'Project updated successfully.' : 'Project created successfully and official project charter document generated.');
      await refresh();
    } catch (err) {
      fail(err);
    }
  };

  const removeProject = async () => {
    if (!editingProject || !window.confirm(`Delete "${editingProject.name}" and all related project records?`)) return;
    try {
      await deleteProject(editingProject.id);
      startProject();
      report('Project and its related records deleted.');
      await refresh();
    } catch (err) {
      fail(err);
    }
  };

  const handleAssignClient = async (e) => {
    e.preventDefault();
    if (!clientAssignProject) {
      fail(new Error('Please select a project to assign.'));
      return;
    }
    try {
      setSavingClientAssign(true);
      const targetProj = projects.find((p) => String(p.id) === String(clientAssignProject));
      if (!targetProj) throw new Error('Selected project not found.');

      const clientObj = clientAssignClient ? { id: Number(clientAssignClient) } : null;
      await updateProject(targetProj.id, {
        ...targetProj,
        client: clientObj,
      });

      const assignedClientName = clients.find((c) => String(c.id) === String(clientAssignClient))?.name || 'No Client';
      report(`Assigned ${assignedClientName} to ${targetProj.name}.`);
      await refresh();
    } catch (err) {
      fail(err);
    } finally {
      setSavingClientAssign(false);
    }
  };

  const openEmpAssignment = (emp) => {
    setSelectedEmpForAssign(emp);
    const pids = emp.assignedProjects ? emp.assignedProjects.map((p) => p.id) : [];
    if (emp.project?.id && !pids.includes(emp.project.id)) {
      pids.push(emp.project.id);
    }
    setAssignedProjectIds(pids);
  };

  const toggleProjectForEmp = (pid) => {
    setAssignedProjectIds((prev) =>
      prev.includes(pid) ? prev.filter((id) => id !== pid) : [...prev, pid]
    );
  };

  const saveEmpAssignments = async (e) => {
    if (e) e.preventDefault();
    if (!selectedEmpForAssign) return;
    try {
      setSavingEmpAssign(true);
      const savedEmp = await assignEmployeeProjects(selectedEmpForAssign.id, assignedProjectIds);
      await refresh();
      const savedIds = savedEmp.assignedProjects ? savedEmp.assignedProjects.map((p) => p.id) : [];
      setSelectedEmpForAssign(savedEmp);
      setAssignedProjectIds(savedIds);
      report(`Project assignments for ${savedEmp.name} saved successfully.`);
    } catch (err) {
      fail(err);
    } finally {
      setSavingEmpAssign(false);
    }
  };

  const saveTask = async (event) => {
    event.preventDefault();
    if (!activeProject) {
      fail(new Error('Please select a project first.'));
      return;
    }
    try {
      await createTask({
        ...taskForm,
        status: (taskForm.status && taskForm.status.trim()) ? taskForm.status.trim() : 'TODO',
        project: { id: activeProject.id },
        assignedEmployee: taskForm.assignedEmployeeId ? { id: Number(taskForm.assignedEmployeeId) } : null,
      });
      setTaskForm(emptyTask);
      report(`Task assigned to project ${activeProject.name}.`);
      await refresh();
    } catch (err) {
      fail(err);
    }
  };

  const completeTask = async (task) => {
    try {
      await updateTask(task.id, {
        ...task,
        status: 'COMPLETED',
        project: { id: task.project.id },
        assignedEmployee: task.assignedEmployee ? { id: task.assignedEmployee.id } : null,
      });
      report('Task marked as completed.');
      await refresh();
    } catch (err) {
      fail(err);
    }
  };

  const saveMilestone = async (event) => {
    event.preventDefault();
    if (!activeProject) {
      fail(new Error('Please select a project first.'));
      return;
    }
    try {
      await addMilestone(activeProject.id, {
        ...milestoneForm,
        progressPercentage: Number(milestoneForm.progressPercentage || 0),
      });
      setMilestoneForm(emptyMilestone);
      report(`Milestone added to ${activeProject.name}.`);
      await refresh();
    } catch (err) {
      fail(err);
    }
  };

  const saveExpense = async (event) => {
    event.preventDefault();
    if (!activeProject) {
      fail(new Error('Please select a project first.'));
      return;
    }
    try {
      await createExpense({
        ...expenseForm,
        amount: Number(expenseForm.amount),
        project: { id: activeProject.id },
      });
      setExpenseForm(emptyExpense);
      report(`Expense recorded for ${activeProject.name}.`);
      await refresh();
    } catch (err) {
      fail(err);
    }
  };

  const removeExpense = async (id) => {
    try {
      await deleteExpense(id);
      report('Expense removed.');
      await refresh();
    } catch (err) {
      fail(err);
    }
  };

  const saveEmployee = async (event) => {
    event.preventDefault();
    if (!activeProject) {
      fail(new Error('Please select a project first.'));
      return;
    }
    try {
      await createEmployee({
        ...employeeForm,
        project: { id: activeProject.id },
      });
      setEmployeeForm({ name: '', email: '', role: '' });
      report(`Employee added to ${activeProject.name} team.`);
      await refresh();
    } catch (err) {
      fail(err);
    }
  };

  const handlePmReplyInquiry = async (e, inquiryId, text) => {
    if (e) e.preventDefault();
    if (!text || !text.trim()) return;
    setSendingPmReply(true);
    try {
      await sendInquiryMessage(inquiryId, {
        senderRole: 'PROJECT_MANAGER',
        senderName: 'Project Manager',
        message: text.trim(),
      });
      report('Reply sent directly to client.');
      setPmReplyingInquiryId(null);
      setPmReplyText('');
      await refresh();
    } catch (err) {
      fail(err);
    } finally {
      setSendingPmReply(false);
    }
  };

  const handleSendComposeInquiry = async (e) => {
    e.preventDefault();
    if (!composeInquiryForm.clientId) {
      fail(new Error('Please select a client to send the inquiry to.'));
      return;
    }
    if (!composeInquiryForm.subject.trim() || !composeInquiryForm.message.trim()) {
      fail(new Error('Please provide both subject and message.'));
      return;
    }
    setSendingComposeInquiry(true);
    try {
      await createInquiry({
        client: { id: Number(composeInquiryForm.clientId) },
        project: composeInquiryForm.projectId ? { id: Number(composeInquiryForm.projectId) } : null,
        subject: composeInquiryForm.subject.trim(),
        message: composeInquiryForm.message.trim(),
        initiatedBy: 'PROJECT_MANAGER',
      });
      report('Inquiry sent directly to client.');
      setComposeInquiryOpen(false);
      setComposeInquiryForm({ clientId: '', projectId: '', subject: '', message: '' });
      await refresh();
    } catch (err) {
      fail(err);
    } finally {
      setSendingComposeInquiry(false);
    }
  };

  const handleDeleteInquiry = async (id) => {
    if (!window.confirm('Are you sure you want to delete this inquiry thread?')) return;
    try {
      await deleteInquiry(id);
      report('Inquiry removed.');
      await refresh();
    } catch (err) {
      fail(err);
    }
  };

  const handleDownloadProjectPdf = async (proj = activeProject) => {
    if (!proj) {
      fail(new Error('Please select a project to download the PDF report.'));
      return;
    }
    try {
      report(`Generating professional PDF dossier for "${proj.name}"...`);
      const projTasks = tasks.filter((t) => t.project?.id === proj.id);
      const projMilestones = proj.milestones || [];
      const projExpenses = expenses.filter((e) => e.project?.id === proj.id);
      const projEmployees = employees.filter((emp) =>
        emp.project?.id === proj.id ||
        (emp.assignedProjects && emp.assignedProjects.some((p) => p.id === proj.id))
      );
      const projSpent = spentByProject[proj.id] || 0;

      await generateProjectDetailsPdf(proj, {
        client: proj.client || clients.find((c) => c.id === proj.clientId),
        tasks: projTasks,
        milestones: projMilestones,
        expenses: projExpenses,
        employees: projEmployees,
        spent: projSpent,
        pmName: 'Project Manager (Operations & Civil Engineering)',
      });
      report(`Project dossier for "${proj.name}" downloaded successfully.`);
    } catch (err) {
      fail(err);
    }
  };

  const ProjectSelector = () => (
    <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <label htmlFor="pm-project-select" style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.92rem' }}>
          Active Project:
        </label>
        <select
          id="pm-project-select"
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          style={{ padding: '7px 12px', borderRadius: '6px', border: '1.5px solid #cbd5e1', background: '#fff', fontWeight: 600, color: '#0f172a', minWidth: '220px' }}
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.status})
            </option>
          ))}
        </select>
      </div>

      {activeProject && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem', color: '#64748b' }}>
            <span>Client: <strong style={{ color: '#0f172a' }}>{activeProject.client?.name || 'In-House'}</strong></span>
            <span>·</span>
            <span>Budget: <strong style={{ color: '#047857' }}>{formatMoney(activeProject.budget)}</strong></span>
            <span>·</span>
            <span>Progress: <strong style={{ color: '#0284c7' }}>{activeProject.progressPercentage || 0}%</strong></span>
          </div>

          <button
            type="button"
            onClick={() => handleDownloadProjectPdf(activeProject)}
            style={{
              padding: '6px 14px',
              background: '#047857',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
              whiteSpace: 'nowrap',
            }}
            title="Download executive project details PDF with images, milestones & tasks"
          >
            <span></span> Download Project PDF (with Images)
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="light-site-wrapper">
      <Navbar />
      <main className="pm-page">
        <section className="pm-hero">
          <div>
            <span className="brand-green-subtitle">OPERATIONS CONTROL</span>
            <h1>Project Manager Workspace</h1>
            <p>Plan projects, coordinate teams, assign clients and employees, and keep every milestone visible.</p>
          </div>
        </section>

        {/* Full Sidebar Navigation matching all requirements */}
        <nav className="pm-tabs">
          <button onClick={() => setTab('overview')} className={tab === 'overview' ? 'active' : ''}>
            Overview
          </button>
          <button
            onClick={() => {
              setTab('client-inquiries-requests');
            }}
            className={['client-inquiries-requests', 'inquiries', 'custom-designs', 'requests'].includes(tab) ? 'active' : ''}
          >
            Client Inquiries &amp; Requests {totalCombinedRequestsCount > 0 ? `(${totalCombinedRequestsCount}${totalCombinedPendingCount > 0 ? ` · ${totalCombinedPendingCount} New` : ''})` : ''}
          </button>
          <button onClick={startProject} className={tab === 'projects' ? 'active' : ''}>
            Projects
          </button>
          <button onClick={() => setTab('assignments')} className={tab === 'assignments' ? 'active' : ''}>
            Assign Employees
          </button>
          <button onClick={() => setTab('tasks')} className={tab === 'tasks' ? 'active' : ''}>
            Tasks &amp; Assignments
          </button>
          <button onClick={() => setTab('milestones')} className={tab === 'milestones' ? 'active' : ''}>
            Milestones
          </button>
          <button onClick={() => setTab('budget')} className={tab === 'budget' ? 'active' : ''}>
            Budget &amp; Expenses
          </button>
          <button onClick={() => setTab('team')} className={tab === 'team' ? 'active' : ''}>
            Project Team
          </button>
        </nav>

        {/* CONTRACT SIGNED NOTIFICATIONS FOR PROJECT CREATION (STEP 5) - SHOWN ONLY IN RELATED DASHBOARD (PROJECTS) */}
        {tab === 'projects' && signedInquiriesAwaitingProject.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
            {signedInquiriesAwaitingProject.map((item) => {
              const matchedContract = contracts.find((c) => c.id === item.contractId) || contracts.find((c) => c.client?.id === item.client?.id);
              return (
                <div
                  key={item.id}
                  style={{
                    background: '#f0fdf4',
                    border: '2px solid #16a34a',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    boxShadow: '0 4px 12px rgba(22,163,74,0.12)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ background: '#16a34a', color: '#fff', fontSize: '0.74rem', fontWeight: 800, padding: '3px 8px', borderRadius: '4px', letterSpacing: '0.5px' }}>
                        {item.downPaymentPaid ? '💰 20% DOWN PAYMENT COMPLETED' : 'CONTRACT SIGNED BY CLIENT MANAGER'}
                      </span>
                      <strong style={{ color: '#14532d', fontSize: '1.02rem' }}>
                        Ready for Project Initialization: "{item.subject}"
                      </strong>
                    </div>
                    <p style={{ margin: '6px 0 0', color: '#166534', fontSize: '0.86rem' }}>
                      Client: <b>{item.client?.name || 'Client'}</b> &bull; {item.downPaymentPaid ? <>Paid Down Payment: <b>{formatMoney(item.downPaymentAmount)}</b> (Ref: #{item.downPaymentRef || 'N/A'}) &bull; </> : null}{matchedContract?.contractNumber ? <>Contract: <b>#{matchedContract.contractNumber}</b> &bull; </> : null}Approved Budget: <b>{formatMoney(item.pmEstimatedBudget || matchedContract?.amount || 0)}</b>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCreateProjectFromSignedContract(item)}
                    style={{
                      padding: '10px 22px',
                      background: '#16a34a',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(22,163,74,0.3)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    🏗️ Create Project
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* PENDING CLIENT INQUIRIES NOTIFICATION (STEP 1) */}
        {pendingInquiriesList.length > 0 && tab !== 'inquiries' && (
          <div
            style={{
              background: '#fffbeb',
              border: '1.5px solid #f59e0b',
              borderRadius: '10px',
              padding: '12px 18px',
              marginBottom: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ background: '#d97706', color: '#fff', fontSize: '0.74rem', fontWeight: 800, padding: '2px 8px', borderRadius: '4px' }}>
                PENDING INQUIRIES
              </span>
              <span style={{ fontSize: '0.88rem', color: '#92400e', fontWeight: 600 }}>
                You have {pendingInquiriesList.length} client design inquiry(ies) awaiting review and approval (Status: Pending).
              </span>
            </div>
            <button
              type="button"
              onClick={() => { setTab('client-inquiries-requests'); setClientReqSubTab('inquiries'); }}
              style={{
                padding: '6px 14px',
                background: '#d97706',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Review Inquiries →
            </button>
          </div>
        )}

        {notice && <div className="pm-alert success">{notice}</div>}
        {error && <div className="pm-alert error">{error}</div>}

        {/* TAB 1: OVERVIEW */}
        {tab === 'overview' && (
          <>
            {/* NEW CLIENT PROJECT REQUESTS BANNER ON OVERVIEW */}
            {(customPendingCount > 0 || catalogPendingCount > 0) && (
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1.5px solid #16a34a',
                  borderRadius: '12px',
                  padding: '14px 20px',
                  marginBottom: '20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                  boxShadow: '0 2px 8px rgba(22,163,74,0.1)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ background: '#16a34a', color: '#fff', fontSize: '0.74rem', fontWeight: 800, padding: '3px 8px', borderRadius: '4px' }}>
                      NEW CLIENT REQUESTS
                    </span>
                    <strong style={{ color: '#14532d', fontSize: '1rem' }}>
                      You have {customPendingCount + catalogPendingCount} client project request(s) awaiting Project Manager review
                    </strong>
                  </div>
                  <p style={{ margin: '4px 0 0', color: '#166534', fontSize: '0.86rem' }}>
                    {customPendingCount > 0 && `• ${customPendingCount} Custom Design submission(s) `}
                    {catalogPendingCount > 0 && `• ${catalogPendingCount} Company Catalog request(s)`}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {customPendingCount > 0 && (
                    <button
                      type="button"
                      onClick={() => { setTab('client-inquiries-requests'); setClientReqSubTab('custom-designs'); }}
                      style={{ padding: '8px 16px', background: '#db2777', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.84rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Review Custom Designs ({customPendingCount}) →
                    </button>
                  )}
                  {catalogPendingCount > 0 && (
                    <button
                      type="button"
                      onClick={() => { setTab('client-inquiries-requests'); setClientReqSubTab('requests'); }}
                      style={{ padding: '8px 16px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.84rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Review Catalog Requests ({catalogPendingCount}) →
                    </button>
                  )}
                </div>
              </div>
            )}

            <section className="pm-metrics">
              <Metric label="Projects created" value={summary.projectCount ?? projects.length} />
              <Metric label="Client Requests" value={customPendingCount + catalogPendingCount > 0 ? `${forwardedRequests.length} (${customPendingCount + catalogPendingCount} New)` : forwardedRequests.length} />
              <Metric label="Team tasks" value={summary.taskCount ?? tasks.length} />
              <Metric label="Tasks completed" value={summary.completedTaskCount ?? tasks.filter((t) => t.status === 'COMPLETED').length} />
              <Metric label="Budget remaining" value={formatMoney(summary.remainingBudget)} />
            </section>
            <section className="pm-card">
              <div className="pm-card-heading">
                <div>
                  <h2>All Construction Projects</h2>
                  <p>Comprehensive overview of every project created in your workspace.</p>
                </div>
              </div>
              <ProjectTable
                projects={projects}
                spentByProject={spentByProject}
                onEdit={editProject}
                onDownloadPdf={handleDownloadProjectPdf}
                emptyMessage="No projects yet. Open Projects to create your first project."
              />
            </section>
          </>
        )}

        {/* UNIFIED CLIENT INQUIRIES & REQUESTS SUB-NAV CONTROLS */}
        {['client-inquiries-requests', 'inquiries', 'custom-designs', 'requests'].includes(tab) && (
          <div style={{ marginBottom: '22px' }}>
            <div style={{
              display: 'flex',
              gap: '10px',
              flexWrap: 'wrap',
              background: '#ffffff',
              padding: '12px 16px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}>
              <button
                type="button"
                onClick={() => { setTab('client-inquiries-requests'); setClientReqSubTab('inquiries'); }}
                style={{
                  padding: '10px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                  background: (tab === 'inquiries' || (tab === 'client-inquiries-requests' && clientReqSubTab === 'inquiries')) ? '#0f4c3a' : '#f1f5f9',
                  color: (tab === 'inquiries' || (tab === 'client-inquiries-requests' && clientReqSubTab === 'inquiries')) ? '#ffffff' : '#334155',
                  boxShadow: (tab === 'inquiries' || (tab === 'client-inquiries-requests' && clientReqSubTab === 'inquiries')) ? '0 2px 6px rgba(15,76,58,0.25)' : 'none',
                }}
              >
                <span>💬</span> Client Inquiries {inquiries.length > 0 ? `(${inquiries.filter((i) => i.status === 'PENDING').length > 0 ? `${inquiries.length} · ${inquiries.filter((i) => i.status === 'PENDING').length} Unread` : inquiries.length})` : ''}
              </button>

              <button
                type="button"
                onClick={() => { setTab('client-inquiries-requests'); setClientReqSubTab('custom-designs'); }}
                style={{
                  padding: '10px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                  background: (tab === 'custom-designs' || (tab === 'client-inquiries-requests' && clientReqSubTab === 'custom-designs')) ? '#0f4c3a' : '#f1f5f9',
                  color: (tab === 'custom-designs' || (tab === 'client-inquiries-requests' && clientReqSubTab === 'custom-designs')) ? '#ffffff' : '#334155',
                  boxShadow: (tab === 'custom-designs' || (tab === 'client-inquiries-requests' && clientReqSubTab === 'custom-designs')) ? '0 2px 6px rgba(15,76,58,0.25)' : 'none',
                }}
              >
                <span>🎨</span> Client Own Designs {customPendingCount > 0 ? `(${customRequests.length} · ${customPendingCount} New)` : (customRequests.length > 0 ? `(${customRequests.length})` : '')}
              </button>

              <button
                type="button"
                onClick={() => { setTab('client-inquiries-requests'); setClientReqSubTab('requests'); }}
                style={{
                  padding: '10px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                  background: (tab === 'requests' || (tab === 'client-inquiries-requests' && clientReqSubTab === 'requests')) ? '#0f4c3a' : '#f1f5f9',
                  color: (tab === 'requests' || (tab === 'client-inquiries-requests' && clientReqSubTab === 'requests')) ? '#ffffff' : '#334155',
                  boxShadow: (tab === 'requests' || (tab === 'client-inquiries-requests' && clientReqSubTab === 'requests')) ? '0 2px 6px rgba(15,76,58,0.25)' : 'none',
                }}
              >
                <span>📋</span> Company Catalog Requests {catalogPendingCount > 0 ? `(${catalogRequests.length} · ${catalogPendingCount} New)` : (catalogRequests.length > 0 ? `(${catalogRequests.length})` : '')}
              </button>
            </div>
          </div>
        )}

        {/* TAB: CLIENT INQUIRIES (Direct PM-Client Communication) */}
        {(tab === 'inquiries' || (tab === 'client-inquiries-requests' && clientReqSubTab === 'inquiries')) && (() => {
          const pendingCount = inquiries.filter((i) => i.status === 'PENDING' && i.pmDecision !== 'APPROVED' && i.pmDecision !== 'REJECTED').length;
          const approvedCount = inquiries.filter((i) => i.pmDecision === 'APPROVED').length;
          const rejectedCount = inquiries.filter((i) => i.pmDecision === 'REJECTED').length;
          const answeredCount = inquiries.filter((i) => i.status === 'ANSWERED' || (i.messages && i.messages.length > 0)).length;

          const filteredInquiries = inquiries.filter((inq) => {
            if (inquiryFilterStatus === 'PENDING' && !(inq.status === 'PENDING' && inq.pmDecision !== 'APPROVED' && inq.pmDecision !== 'REJECTED')) return false;
            if (inquiryFilterStatus === 'APPROVED' && inq.pmDecision !== 'APPROVED') return false;
            if (inquiryFilterStatus === 'REJECTED' && inq.pmDecision !== 'REJECTED') return false;
            if (inquiryFilterStatus === 'ANSWERED' && inq.status !== 'ANSWERED') return false;
            if (inquiryClientFilter && String(inq.client?.id) !== String(inquiryClientFilter)) return false;
            if (inquiryProjectFilter && String(inq.project?.id) !== String(inquiryProjectFilter)) return false;
            if (inquirySearch) {
              const q = inquirySearch.toLowerCase();
              const subjectMatch = inq.subject?.toLowerCase().includes(q);
              const messageMatch = inq.message?.toLowerCase().includes(q);
              const clientMatch = inq.client?.name?.toLowerCase().includes(q) || inq.client?.email?.toLowerCase().includes(q);
              const projectMatch = inq.project?.name?.toLowerCase().includes(q);
              if (!subjectMatch && !messageMatch && !clientMatch && !projectMatch) return false;
            }
            return true;
          });

          return (
            <section className="pm-card" style={{ padding: '1.75rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1.25rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#ecfdf5', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>
                      
                    </div>
                    <div>
                      <h2 style={{ margin: 0, fontSize: '1.35rem', color: '#0f172a', fontWeight: 800 }}>Direct Client Inquiries &amp; Communications</h2>
                      <p style={{ margin: '3px 0 0', color: '#64748b', fontSize: '0.88rem' }}>
                        Private engineering inquiries directly between property owners and Project Management.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="pm-btn primary"
                  style={{
                    background: '#047857',
                    borderColor: '#047857',
                    padding: '0.65rem 1.35rem',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 6px rgba(4,120,87,0.25)',
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    setComposeInquiryForm({ clientId: '', projectId: '', subject: '', message: '' });
                    setComposeInquiryOpen(true);
                  }}
                >
                  <span>️</span> Compose Inquiry to Client
                </button>
              </div>

              {/* Status & Search Filter Bar */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', margin: '1.25rem 0 1.5rem', background: '#f8fafc', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                {/* Filter pills */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    style={{
                      padding: '7px 14px',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: 'none',
                      transition: 'all 0.15s ease',
                      background: inquiryFilterStatus === 'ALL' ? '#047857' : '#ffffff',
                      color: inquiryFilterStatus === 'ALL' ? '#ffffff' : '#475569',
                      boxShadow: inquiryFilterStatus === 'ALL' ? '0 2px 4px rgba(4,120,87,0.2)' : '0 1px 2px rgba(0,0,0,0.05)',
                    }}
                    onClick={() => setInquiryFilterStatus('ALL')}
                  >
                    All Inquiries ({inquiries.length})
                  </button>

                  <button
                    type="button"
                    style={{
                      padding: '7px 14px',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: 'none',
                      transition: 'all 0.15s ease',
                      background: inquiryFilterStatus === 'PENDING' ? '#d97706' : '#ffffff',
                      color: inquiryFilterStatus === 'PENDING' ? '#ffffff' : '#b45309',
                      boxShadow: inquiryFilterStatus === 'PENDING' ? '0 2px 4px rgba(217,119,6,0.2)' : '0 1px 2px rgba(0,0,0,0.05)',
                    }}
                    onClick={() => setInquiryFilterStatus('PENDING')}
                  >
                    ⏳ Awaiting PM ({pendingCount})
                  </button>

                  <button
                    type="button"
                    style={{
                      padding: '7px 14px',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: 'none',
                      transition: 'all 0.15s ease',
                      background: inquiryFilterStatus === 'APPROVED' ? '#059669' : '#ffffff',
                      color: inquiryFilterStatus === 'APPROVED' ? '#ffffff' : '#047857',
                      boxShadow: inquiryFilterStatus === 'APPROVED' ? '0 2px 4px rgba(5,150,105,0.2)' : '0 1px 2px rgba(0,0,0,0.05)',
                    }}
                    onClick={() => setInquiryFilterStatus('APPROVED')}
                  >
                     Approved ({approvedCount})
                  </button>

                  <button
                    type="button"
                    style={{
                      padding: '7px 14px',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: 'none',
                      transition: 'all 0.15s ease',
                      background: inquiryFilterStatus === 'REJECTED' ? '#dc2626' : '#ffffff',
                      color: inquiryFilterStatus === 'REJECTED' ? '#ffffff' : '#b91c1c',
                      boxShadow: inquiryFilterStatus === 'REJECTED' ? '0 2px 4px rgba(220,38,38,0.2)' : '0 1px 2px rgba(0,0,0,0.05)',
                    }}
                    onClick={() => setInquiryFilterStatus('REJECTED')}
                  >
                     Rejected ({rejectedCount})
                  </button>

                  <button
                    type="button"
                    style={{
                      padding: '7px 14px',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: 'none',
                      transition: 'all 0.15s ease',
                      background: inquiryFilterStatus === 'ANSWERED' ? '#0284c7' : '#ffffff',
                      color: inquiryFilterStatus === 'ANSWERED' ? '#ffffff' : '#0369a1',
                      boxShadow: inquiryFilterStatus === 'ANSWERED' ? '0 2px 4px rgba(2,132,199,0.2)' : '0 1px 2px rgba(0,0,0,0.05)',
                    }}
                    onClick={() => setInquiryFilterStatus('ANSWERED')}
                  >
                     In Discussion ({answeredCount})
                  </button>
                </div>

                {/* Search */}
                <div style={{ flex: 1, minWidth: '190px' }}>
                  <input
                    type="text"
                    placeholder=" Search inquiries by client, subject, or message..."
                    value={inquirySearch}
                    onChange={(e) => setInquirySearch(e.target.value)}
                    style={{ width: '100%', padding: '7px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.84rem', background: '#fff', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Select Client */}
                <div style={{ minWidth: '160px' }}>
                  <select
                    value={inquiryClientFilter}
                    onChange={(e) => setInquiryClientFilter(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.84rem', background: '#fff' }}
                  >
                    <option value="">All Clients</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Select Project */}
                <div style={{ minWidth: '160px' }}>
                  <select
                    value={inquiryProjectFilter}
                    onChange={(e) => setInquiryProjectFilter(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.84rem', background: '#fff' }}
                  >
                    <option value="">All Projects</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Inquiry List */}
              {filteredInquiries.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3.5rem 1rem', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#64748b' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}></div>
                  <h3 style={{ margin: '0 0 0.5rem', color: '#1e293b', fontSize: '1.15rem' }}>No Inquiries Match the Selected Filter</h3>
                  <p style={{ margin: 0, fontSize: '0.88rem' }}>When clients send questions or custom project inquiries, they will appear here for you to evaluate and answer.</p>
                  {(inquiryFilterStatus !== 'ALL' || inquirySearch || inquiryClientFilter || inquiryProjectFilter) && (
                    <button
                      type="button"
                      onClick={() => {
                        setInquiryFilterStatus('ALL');
                        setInquirySearch('');
                        setInquiryClientFilter('');
                        setInquiryProjectFilter('');
                      }}
                      style={{ marginTop: '1rem', padding: '6px 14px', background: '#047857', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Reset All Filters
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {filteredInquiries.map((inq) => {
                    const isPending = inq.status === 'PENDING' && inq.pmDecision !== 'APPROVED' && inq.pmDecision !== 'REJECTED';
                    const isApproved = inq.pmDecision === 'APPROVED';
                    const isRejected = inq.pmDecision === 'REJECTED';
                    const isReplying = pmReplyingInquiryId === inq.id;
                    const isClientInitiated = inq.initiatedBy === 'CLIENT';
                    const clientInitial = inq.client?.name ? inq.client.name.charAt(0).toUpperCase() : 'C';

                    return (
                      <div
                        key={inq.id}
                        style={{
                          background: '#ffffff',
                          border: isPending
                            ? '1.5px solid #f59e0b'
                            : isApproved
                            ? '1.5px solid #10b981'
                            : isRejected
                            ? '1.5px solid #f87171'
                            : '1px solid #e2e8f0',
                          borderLeft: isPending
                            ? '5px solid #f59e0b'
                            : isApproved
                            ? '5px solid #10b981'
                            : isRejected
                            ? '5px solid #ef4444'
                            : '5px solid #64748b',
                          borderRadius: '14px',
                          padding: '1.5rem',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        }}
                      >
                        {/* Header Row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.85rem' }}>
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                            {/* Client Avatar Chip */}
                            <div
                              style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: '50%',
                                background: '#e0f2fe',
                                color: '#0369a1',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '1rem',
                                flexShrink: 0,
                                border: '1.5px solid #bae6fd',
                              }}
                            >
                              {clientInitial}
                            </div>

                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                                <h3 style={{ margin: 0, fontSize: '1.18rem', color: '#0f172a', fontWeight: 800 }}>{inq.subject}</h3>
                                
                                {isPending && (
                                  <span style={{ padding: '2px 9px', borderRadius: '12px', fontSize: '0.74rem', fontWeight: 700, background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}>
                                    ⏳ Action Needed (Awaiting Your Reply)
                                  </span>
                                )}
                                {inq.downPaymentPaid && (
                                  <span style={{ padding: '2px 9px', borderRadius: '12px', fontSize: '0.74rem', fontWeight: 800, background: '#dcfce7', color: '#15803d', border: '1px solid #86efac' }}>
                                    💰 Down Payment Paid ({formatMoney(inq.downPaymentAmount)})
                                  </span>
                                )}
                                {inq.clientAccepted && !inq.downPaymentPaid && (
                                  <span style={{ padding: '2px 9px', borderRadius: '12px', fontSize: '0.74rem', fontWeight: 700, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
                                    ✓ Client Accepted Quotation
                                  </span>
                                )}
                                {isApproved && (
                                  <span style={{ padding: '2px 9px', borderRadius: '12px', fontSize: '0.74rem', fontWeight: 700, background: '#dcfce7', color: '#166534', border: '1px solid #86efac' }}>
                                     Project Feasibility Approved
                                  </span>
                                )}
                                {isRejected && (
                                  <span style={{ padding: '2px 9px', borderRadius: '12px', fontSize: '0.74rem', fontWeight: 700, background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' }}>
                                     Feasibility Not Feasible
                                  </span>
                                )}
                                {!isPending && !isApproved && !isRejected && (
                                  <span style={{ padding: '2px 9px', borderRadius: '12px', fontSize: '0.74rem', fontWeight: 700, background: '#f1f5f9', color: '#334155', border: '1px solid #e2e8f0' }}>
                                    In Discussion
                                  </span>
                                )}
                                {inq.contractGenerated && (
                                  <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700, background: '#e0e7ff', color: '#3730a3', border: '1px solid #c7d2fe' }}>
                                     Contract Linked
                                  </span>
                                )}
                              </div>

                              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', fontSize: '0.84rem', color: '#64748b' }}>
                                <span>Client: <strong style={{ color: '#0f172a' }}>{inq.client?.name || 'Client'}</strong></span>
                                {inq.client?.email && (
                                  <span>• <a href={`mailto:${inq.client.email}`} style={{ color: '#0284c7', textDecoration: 'none' }}>{inq.client.email}</a></span>
                                )}
                                {inq.client?.phone && (
                                  <span>• <a href={`tel:${inq.client.phone}`} style={{ color: '#64748b', textDecoration: 'none' }}>{inq.client.phone}</a></span>
                                )}
                                <span>• Started {formatDate(inq.createdAt)} {isClientInitiated ? 'by Client' : 'by You'}</span>
                                {inq.project && (
                                  <span style={{ color: '#0369a1', fontWeight: 600, background: '#f0f9ff', padding: '1px 6px', borderRadius: '4px' }}>
                                     {inq.project.name}
                                  </span>
                                )}
                                {inq.design && (
                                  <span style={{ color: '#7c3aed', fontWeight: 600, background: '#f5f3ff', padding: '1px 6px', borderRadius: '4px' }}>
                                    ️ {inq.design.name}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => handleDeleteInquiry(inq.id)}
                              style={{ padding: '5px 12px', background: '#fff', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '6px', fontSize: '0.76rem', cursor: 'pointer', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              title="Delete inquiry thread"
                            >
                              <span>️</span> Delete
                            </button>
                          </div>
                        </div>

                        {/* Thread View */}
                        <div style={{ marginTop: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
                            Direct Inquiry Conversation
                          </div>
                          <InquiryThread inquiry={inq} viewerRole="PROJECT_MANAGER" />
                        </div>

                        {/* Engineering Feasibility & Project Approval Box */}
                        <div
                          style={{
                            marginTop: '1.25rem',
                            padding: '1.25rem',
                            background: isApproved ? '#f0fdf4' : isRejected ? '#fef2f2' : '#fffbeb',
                            borderRadius: '12px',
                            border: `1.5px solid ${isApproved ? '#86efac' : isRejected ? '#fca5a5' : '#fde68a'}`,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '0.75rem' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span
                                  style={{
                                    padding: '3px 10px',
                                    borderRadius: '6px',
                                    fontSize: '0.78rem',
                                    fontWeight: 800,
                                    background: isApproved ? '#dcfce7' : isRejected ? '#fee2e2' : '#fef3c7',
                                    color: isApproved ? '#166534' : isRejected ? '#991b1b' : '#b45309',
                                    border: `1px solid ${isApproved ? '#86efac' : isRejected ? '#fca5a5' : '#fde68a'}`,
                                  }}
                                >
                                  {isApproved ? ' TECHNICAL FEASIBILITY: APPROVED' : isRejected ? ' TECHNICAL FEASIBILITY: NOT FEASIBLE' : '⏳ TECHNICAL DECISION REQUIRED'}
                                </span>
                                {inq.pmDecisionDate && (
                                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                                    Evaluated {formatDate(inq.pmDecisionDate)}
                                  </span>
                                )}
                              </div>
                              <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: isApproved ? '#166534' : isRejected ? '#991b1b' : '#78350f' }}>
                                {isApproved
                                  ? 'Project scope & technical specifications verified. Transmitted to Client Management for formal contract agreement.'
                                  : isRejected
                                  ? 'Engineering parameters not feasible at this time. Client has been notified.'
                                  : 'Review engineering feasibility and record official Project Manager approval decision.'}
                              </p>
                            </div>

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              {(inq.downPaymentPaid || inq.contractGenerated) && !inq.project && (
                                <button
                                  type="button"
                                  onClick={() => handleCreateProjectFromSignedContract(inq)}
                                  style={{
                                    padding: '7px 18px',
                                    background: '#16a34a',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: 800,
                                    fontSize: '0.84rem',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    boxShadow: '0 2px 6px rgba(22,163,74,0.3)',
                                  }}
                                >
                                  🏗️ Initialize Project {inq.downPaymentPaid ? '(Payment Verified)' : ''}
                                </button>
                              )}

                              {!isApproved && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenInquiryDecisionModal(inq, 'APPROVED')}
                                  style={{
                                    padding: '7px 16px',
                                    background: '#16a34a',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: 700,
                                    fontSize: '0.82rem',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    boxShadow: '0 2px 4px rgba(22,163,74,0.25)',
                                  }}
                                >
                                  <span>✔️</span> {isRejected ? 'Re-evaluate & Approve' : 'Approve'}
                                </button>
                              )}

                              {!isRejected && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenInquiryDecisionModal(inq, 'REJECTED')}
                                  style={{
                                    padding: '7px 16px',
                                    background: '#ffffff',
                                    color: '#dc2626',
                                    border: '1.5px solid #f87171',
                                    borderRadius: '8px',
                                    fontWeight: 700,
                                    fontSize: '0.82rem',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                  }}
                                >
                                  <span>❌</span> {isApproved ? 'Change to Rejected' : 'Reject'}
                                </button>
                              )}

                              {(isApproved || isRejected) && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenInquiryDecisionModal(inq, inq.pmDecision)}
                                  style={{
                                    padding: '7px 14px',
                                    background: '#f8fafc',
                                    color: '#334155',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '8px',
                                    fontWeight: 700,
                                    fontSize: '0.8rem',
                                    cursor: 'pointer',
                                  }}
                                >
                                  ✏️ Edit Assessment Details
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Metric Tiles */}
                          {(inq.pmEstimatedBudget || inq.pmEstimatedDuration) && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginTop: '0.85rem' }}>
                              {inq.pmEstimatedBudget && (
                                <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                  <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>Estimated Construction Budget</div>
                                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#047857', marginTop: '2px' }}>
                                    {formatMoney(inq.pmEstimatedBudget)}
                                  </div>
                                </div>
                              )}
                              {inq.pmEstimatedDuration && (
                                <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                  <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>Estimated Project Duration</div>
                                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                                    ⏱️ {inq.pmEstimatedDuration}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {inq.pmDecisionRemarks && (
                            <div style={{ marginTop: '0.85rem', padding: '10px 14px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.86rem', color: '#1e293b' }}>
                              <strong style={{ color: '#475569', display: 'block', fontSize: '0.76rem', textTransform: 'uppercase', marginBottom: '3px' }}>
                                Engineering Remarks &amp; Specifications:
                              </strong>
                              {inq.pmDecisionRemarks}
                            </div>
                          )}
                        </div>

                        {/* Down Payment & Acceptance Status Box */}
                        {inq.downPaymentPaid ? (
                          <div style={{
                            marginTop: '1rem',
                            padding: '1rem 1.25rem',
                            background: '#ecfdf5',
                            border: '1.5px solid #10b981',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '12px',
                          }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ background: '#059669', color: '#fff', fontSize: '0.74rem', fontWeight: 800, padding: '3px 8px', borderRadius: '4px' }}>
                                  ✓ INITIAL 20% DOWN PAYMENT COMPLETED
                                </span>
                                <span style={{ fontSize: '0.86rem', color: '#065f46', fontWeight: 700 }}>
                                  Verified Down Payment: {formatMoney(inq.downPaymentAmount)}
                                </span>
                              </div>
                              <div style={{ marginTop: '4px', fontSize: '0.84rem', color: '#047857' }}>
                                Reference: <strong>#{inq.downPaymentRef || 'N/A'}</strong> {inq.downPaymentDate && `• Paid on ${formatDate(inq.downPaymentDate)}`}
                              </div>
                            </div>
                            {!inq.project && (
                              <button
                                type="button"
                                onClick={() => handleCreateProjectFromSignedContract(inq)}
                                style={{
                                  padding: '8px 18px',
                                  background: '#16a34a',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '8px',
                                  fontWeight: 800,
                                  fontSize: '0.85rem',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  boxShadow: '0 2px 6px rgba(22,163,74,0.3)',
                                }}
                              >
                                🏗️ Initialize Project Now →
                              </button>
                            )}
                          </div>
                        ) : inq.clientAccepted ? (
                          <div style={{
                            marginTop: '1rem',
                            padding: '0.85rem 1.15rem',
                            background: '#eff6ff',
                            border: '1.5px solid #3b82f6',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '8px',
                          }}>
                            <div>
                              <span style={{ background: '#2563eb', color: '#fff', fontSize: '0.74rem', fontWeight: 800, padding: '2px 8px', borderRadius: '4px' }}>
                                ✓ CLIENT ACCEPTED PROPOSAL
                              </span>
                              <span style={{ marginLeft: '8px', fontSize: '0.85rem', color: '#1e40af', fontWeight: 600 }}>
                                Client accepted estimated budget of {formatMoney(inq.pmEstimatedBudget || 0)}. Awaiting client initial down payment (20%).
                              </span>
                            </div>
                          </div>
                        ) : null}

                        {/* Attachment */}
                        {inq.attachmentData && (
                          <div style={{ margin: '0.85rem 0' }}>
                            <a href={inq.attachmentData} download={inq.attachmentName || 'client-attachment'} className="pm-btn secondary" style={{ display: 'inline-flex', fontSize: '0.82rem', padding: '0.35rem 0.85rem', borderRadius: '6px' }}>
                               View Attached File: {inq.attachmentName || 'Attachment'}
                            </a>
                          </div>
                        )}

                        {/* Quick Response Section */}
                        <div style={{ marginTop: '1.25rem', padding: '1.25rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', flexWrap: 'wrap', gap: '8px' }}>
                            <label style={{ fontWeight: 800, fontSize: '0.88rem', color: '#047857', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>️</span> Direct Reply to Client:
                            </label>

                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                style={{ fontSize: '0.74rem', padding: '3px 10px', borderRadius: '6px', background: '#ffffff', border: '1px solid #cbd5e1', cursor: 'pointer', color: '#334155', fontWeight: 600 }}
                                onClick={() => {
                                  setPmReplyingInquiryId(inq.id);
                                  setPmReplyText('We have reviewed your inquiry and our site engineering team is verifying the structural specifications.');
                                }}
                              >
                                Reviewing specs
                              </button>
                              <button
                                type="button"
                                style={{ fontSize: '0.74rem', padding: '3px 10px', borderRadius: '6px', background: '#ffffff', border: '1px solid #cbd5e1', cursor: 'pointer', color: '#334155', fontWeight: 600 }}
                                onClick={() => {
                                  setPmReplyingInquiryId(inq.id);
                                  setPmReplyText('Thank you for reaching out. We will inspect the site progress and provide updated photos and milestone status shortly.');
                                }}
                              >
                                Site inspection
                              </button>
                              <button
                                type="button"
                                style={{ fontSize: '0.74rem', padding: '3px 10px', borderRadius: '6px', background: '#ffffff', border: '1px solid #cbd5e1', cursor: 'pointer', color: '#334155', fontWeight: 600 }}
                                onClick={() => {
                                  setPmReplyingInquiryId(inq.id);
                                  setPmReplyText('We have scheduled the on-site technical consultation for your project as requested.');
                                }}
                              >
                                Consultation scheduled
                              </button>
                            </div>
                          </div>

                          <textarea
                            rows={3}
                            placeholder="Type your message directly to the client..."
                            value={isReplying ? pmReplyText : ''}
                            onFocus={() => {
                              if (pmReplyingInquiryId !== inq.id) {
                                setPmReplyingInquiryId(inq.id);
                                setPmReplyText('');
                              }
                            }}
                            onChange={(e) => {
                              setPmReplyingInquiryId(inq.id);
                              setPmReplyText(e.target.value);
                            }}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box', background: '#ffffff', lineHeight: 1.5 }}
                          />

                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem', gap: '8px' }}>
                            {isReplying && pmReplyText && (
                              <button
                                type="button"
                                onClick={() => {
                                  setPmReplyingInquiryId(null);
                                  setPmReplyText('');
                                }}
                                style={{ padding: '7px 14px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem', cursor: 'pointer' }}
                              >
                                Clear
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={sendingPmReply || !isReplying || !pmReplyText.trim()}
                              onClick={(e) => handlePmReplyInquiry(e, inq.id, pmReplyText)}
                              style={{
                                padding: '8px 20px',
                                background: isReplying && pmReplyText.trim() ? '#047857' : '#9ca3af',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: 700,
                                fontSize: '0.86rem',
                                cursor: isReplying && pmReplyText.trim() ? 'pointer' : 'not-allowed',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                boxShadow: isReplying && pmReplyText.trim() ? '0 2px 4px rgba(4,120,87,0.25)' : 'none',
                              }}
                            >
                              {sendingPmReply && isReplying ? 'Sending Reply...' : 'Send Reply Directly to Client →'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })()}

        {/* TAB: CLIENT'S OWN CUSTOM DESIGN REQUESTS (Direct to PM) */}
        {(tab === 'custom-designs' || (tab === 'client-inquiries-requests' && clientReqSubTab === 'custom-designs')) && (
          <section className="pm-card" style={{ padding: '1.75rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#fdf2f8', color: '#db2777', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 'bold', border: '1px solid #fbcfe8' }}>
                  
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{ margin: 0, fontSize: '1.35rem', color: '#0f172a', fontWeight: 800 }}>Client's Own Custom Design Requests</h2>
                    <span style={{ background: '#fdf2f8', color: '#9d174d', border: '1px solid #fbcfe8', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800 }}>
                      DIRECT PM INBOX
                    </span>
                  </div>
                  <p style={{ margin: '3px 0 0', color: '#64748b', fontSize: '0.88rem' }}>
                    Custom architectural designs, site blueprints, and floor plans submitted by clients. Review feasibility, approve with down payment instructions, or decline.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    background: customPendingCount > 0 ? '#fef3c7' : '#ecfdf5',
                    color: customPendingCount > 0 ? '#b45309' : '#047857',
                    border: `1px solid ${customPendingCount > 0 ? '#fde68a' : '#a7f3d0'}`,
                  }}
                >
                  {customPendingCount} Pending PM Decision
                </span>
              </div>
            </div>

            {/* KPI Strip for Custom Designs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginTop: '1.25rem' }}>
              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <small style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>Total Custom Submissions</small>
                <strong style={{ fontSize: '1.35rem', color: '#0f172a' }}>{customRequests.length}</strong>
              </div>
              <div style={{ background: '#fffbeb', padding: '12px 14px', borderRadius: '10px', border: '1px solid #fef3c7' }}>
                <small style={{ color: '#b45309', display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>Awaiting PM Review</small>
                <strong style={{ fontSize: '1.35rem', color: '#d97706' }}>{customPendingCount}</strong>
              </div>
              <div style={{ background: '#f0fdf4', padding: '12px 14px', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                <small style={{ color: '#15803d', display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>Approved (Awaiting Down Payment)</small>
                <strong style={{ fontSize: '1.35rem', color: '#16a34a' }}>
                  {customRequests.filter((r) => r.status === 'APPROVED').length}
                </strong>
              </div>
              <div style={{ background: '#ecfdf5', padding: '12px 14px', borderRadius: '10px', border: '1px solid #a7f3d0' }}>
                <small style={{ color: '#047857', display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>Construction Started</small>
                <strong style={{ fontSize: '1.35rem', color: '#059669' }}>
                  {customRequests.filter((r) => r.status === 'PROJECT_STARTED').length}
                </strong>
              </div>
              <div style={{ background: '#fef2f2', padding: '12px 14px', borderRadius: '10px', border: '1px solid #fecaca' }}>
                <small style={{ color: '#b91c1c', display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>Rejected</small>
                <strong style={{ fontSize: '1.35rem', color: '#dc2626' }}>
                  {customRequests.filter((r) => r.status === 'REJECTED').length}
                </strong>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '1.25rem', padding: '12px 16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ flex: 1, minWidth: '220px' }}>
                <input
                  type="text"
                  placeholder=" Search custom requests by title, client, or location..."
                  value={customSearchQuery}
                  onChange={(e) => setCustomSearchQuery(e.target.value)}
                  style={{ width: '100%', padding: '0.45rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ minWidth: '200px' }}>
                <select
                  value={customFilterClient}
                  onChange={(e) => setCustomFilterClient(e.target.value)}
                  style={{ width: '100%', padding: '0.45rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#fff' }}
                >
                  <option value="ALL">All Clients ({customRequests.length})</option>
                  {clients
                    .filter((c) => customRequests.some((r) => r.client?.id === c.id))
                    .map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[
                  { key: 'ALL', label: 'All' },
                  { key: 'PENDING', label: `Pending (${customPendingCount})` },
                  { key: 'APPROVED', label: 'Approved' },
                  { key: 'PROJECT_STARTED', label: 'Started' },
                  { key: 'REJECTED', label: 'Rejected' },
                ].map((chip) => (
                  <button
                    key={chip.key}
                    type="button"
                    onClick={() => setCustomFilterStatus(chip.key)}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: '16px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: customFilterStatus === chip.key ? '2px solid #047857' : '1px solid #cbd5e1',
                      background: customFilterStatus === chip.key ? '#047857' : '#ffffff',
                      color: customFilterStatus === chip.key ? '#ffffff' : '#334155',
                    }}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Requests List */}
            {(() => {
              const list = customRequests.filter((req) => {
                if (customFilterStatus !== 'ALL') {
                  if (customFilterStatus === 'PENDING') {
                    if (req.status !== 'PENDING_PM_REVIEW' && req.status !== 'FORWARDED_TO_PM') return false;
                  } else if (req.status !== customFilterStatus) {
                    return false;
                  }
                }
                if (customFilterClient !== 'ALL') {
                  if (String(req.client?.id) !== String(customFilterClient)) return false;
                }
                if (customSearchQuery.trim()) {
                  const q = customSearchQuery.toLowerCase();
                  const tMatch = (req.title || '').toLowerCase().includes(q);
                  const lMatch = (req.location || '').toLowerCase().includes(q);
                  const cMatch = (req.client?.name || '').toLowerCase().includes(q);
                  if (!tMatch && !lMatch && !cMatch) return false;
                }
                return true;
              });

              if (list.length === 0) {
                return (
                  <div style={{ textAlign: 'center', padding: '3.5rem 1rem', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#64748b', marginTop: '1.25rem' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}></div>
                    <h3 style={{ margin: '0 0 0.5rem', color: '#1e293b', fontSize: '1.15rem' }}>No Client Custom Designs in this View</h3>
                    <p style={{ margin: 0, fontSize: '0.88rem' }}>When clients request their own custom design with drawings or sketches, they appear directly in this section.</p>
                  </div>
                );
              }

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.25rem' }}>
                  {list.map((req) => {
                    const isAwaitingPm = req.status === 'PENDING_PM_REVIEW' || req.status === 'FORWARDED_TO_PM';
                    const isPmReviewed = req.status === 'PM_REVIEWED';
                    const isClientNotified = req.status === 'CLIENT_NOTIFIED';
                    const isApproved = req.status === 'APPROVED';
                    const isRejected = req.status === 'REJECTED';
                    const isStarted = req.status === 'PROJECT_STARTED';

                    const currentStep = isStarted ? 4 : isApproved ? 3 : (isPmReviewed || isClientNotified) ? 2 : 1;

                    return (
                      <div
                        key={req.id}
                        style={{
                          background: '#ffffff',
                          border: isStarted
                            ? '2px solid #10b981'
                            : isApproved
                            ? '2px solid #16a34a'
                            : isAwaitingPm
                            ? '1.5px solid #f59e0b'
                            : isRejected
                            ? '1px solid #fca5a5'
                            : '1px solid #e2e8f0',
                          borderRadius: '16px',
                          padding: '1.5rem',
                          boxShadow: '0 3px 10px rgba(0,0,0,0.04)',
                        }}
                      >
                        {/* Top Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.85rem' }}>
                          <div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#9d174d', background: '#fdf2f8', border: '1px solid #fbcfe8', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                 Client's Own Custom Design
                              </span>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#047857', background: '#ecfdf5', padding: '2px 8px', borderRadius: '4px' }}>
                                {req.category || 'RESIDENCIES'} • #{req.id}
                              </span>
                              <span style={{ fontSize: '0.84rem', color: '#64748b' }}>
                                Client: <strong style={{ color: '#0f172a' }}>{req.client?.name || 'Valued Client'}</strong>
                              </span>
                              {req.client?.phone && (
                                <span style={{ fontSize: '0.82rem', color: '#64748b' }}> {req.client.phone}</span>
                              )}
                              {req.client?.email && (
                                <span style={{ fontSize: '0.82rem', color: '#64748b' }}>️ {req.client.email}</span>
                              )}
                            </div>

                            <h3 style={{ margin: '0.2rem 0', color: '#0f172a', fontSize: '1.3rem', fontWeight: 800 }}>{req.title}</h3>

                            <div style={{ display: 'flex', gap: '1rem', color: '#64748b', fontSize: '0.85rem', marginTop: '4px', flexWrap: 'wrap' }}>
                              <span> Location: <strong style={{ color: '#334155' }}>{req.location || 'N/A'}</strong></span>
                              <span> Target Start: <strong style={{ color: '#334155' }}>{req.targetStartDate ? formatDate(req.targetStartDate) : 'Flexible'}</strong></span>
                              <span> Submitted: <strong style={{ color: '#334155' }}>{formatDate(req.createdAt)}</strong></span>
                            </div>
                          </div>

                          {/* Status badge */}
                          <div>
                            {isAwaitingPm && (
                              <span style={{ padding: '0.45rem 1rem', borderRadius: '20px', background: '#fef3c7', color: '#b45309', fontWeight: 800, fontSize: '0.82rem', border: '1px solid #fde68a', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                ⏳ Pending PM Review &amp; Decision
                              </span>
                            )}
                            {isPmReviewed && !isApproved && (
                              <span style={{ padding: '0.45rem 1rem', borderRadius: '20px', background: '#eff6ff', color: '#1e40af', fontWeight: 700, fontSize: '0.82rem', border: '1px solid #bfdbfe' }}>
                                 Feasibility Assessed
                              </span>
                            )}
                            {isApproved && (
                              <span style={{ padding: '0.45rem 1.1rem', borderRadius: '20px', background: '#dcfce7', color: '#166534', fontWeight: 800, fontSize: '0.84rem', border: '1px solid #86efac', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                 Approved by PM (Awaiting Down Payment)
                              </span>
                            )}
                            {isStarted && (
                              <span style={{ padding: '0.45rem 1.1rem', borderRadius: '20px', background: '#ecfdf5', color: '#047857', border: '1.5px solid #10b981', fontWeight: 800, fontSize: '0.84rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                 Construction Started (ID #{req.startedProjectId})
                              </span>
                            )}
                            {isRejected && (
                              <span style={{ padding: '0.45rem 1rem', borderRadius: '20px', background: '#fee2e2', color: '#b91c1c', fontWeight: 800, fontSize: '0.82rem', border: '1px solid #fca5a5' }}>
                                 Scope Rejected
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Stepper */}
                        <div style={{ margin: '1rem 0', background: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            {[
                              { step: 1, label: '1. Client Submitted' },
                              { step: 2, label: '2. PM Feasibility Review' },
                              { step: 3, label: '3. PM Approved (Down Payment)' },
                              { step: 4, label: '4. Construction Active' },
                            ].map((s) => {
                              const isDone = currentStep >= s.step;
                              const isCurrent = currentStep === s.step;
                              return (
                                <div key={s.step} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}>
                                  <span
                                    style={{
                                      width: '20px',
                                      height: '20px',
                                      borderRadius: '50%',
                                      background: isDone ? '#047857' : '#e2e8f0',
                                      color: isDone ? '#ffffff' : '#64748b',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontWeight: 700,
                                      fontSize: '0.7rem',
                                    }}
                                  >
                                    {isDone ? '' : s.step}
                                  </span>
                                  <span style={{ fontWeight: isCurrent ? 800 : isDone ? 600 : 400, color: isCurrent ? '#047857' : isDone ? '#0f172a' : '#94a3b8' }}>
                                    {s.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Overview Tiles */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', margin: '1rem 0' }}>
                          <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                            <small style={{ color: '#64748b', display: 'block', fontSize: '0.76rem', fontWeight: 600 }}>Client Expected Budget</small>
                            <strong style={{ color: '#047857', fontSize: '1.15rem', display: 'block', marginTop: '2px' }}>
                              {req.expectedBudget ? formatMoney(req.expectedBudget) : 'Custom Quote'}
                            </strong>
                          </div>

                          <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                            <small style={{ color: '#64748b', display: 'block', fontSize: '0.76rem', fontWeight: 600 }}>PM Approved / Estimated Cost</small>
                            <strong style={{ color: req.pmEstimatedBudget ? '#0f172a' : '#94a3b8', fontSize: '1.15rem', display: 'block', marginTop: '2px' }}>
                              {req.pmEstimatedBudget ? formatMoney(req.pmEstimatedBudget) : 'Not Estimated Yet'}
                            </strong>
                          </div>

                          <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                            <small style={{ color: '#64748b', display: 'block', fontSize: '0.76rem', fontWeight: 600 }}>Estimated Construction Timeline</small>
                            <strong style={{ color: '#0f172a', fontSize: '1rem', display: 'block', marginTop: '2px' }}>
                              ⏱️ {req.pmEstimatedDuration || 'Pending Assessment'}
                            </strong>
                          </div>
                        </div>

                        {/* Client Scope & Requirements */}
                        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem', margin: '0.85rem 0' }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '4px' }}>
                            Client Architectural Vision &amp; Scope:
                          </div>
                          <p style={{ margin: 0, color: '#1e3a8a', fontSize: '0.92rem', lineHeight: 1.5 }}>
                            {req.description}
                          </p>
                          {req.specifications && (
                            <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed #e2e8f0', fontSize: '0.86rem', color: '#475569' }}>
                              <strong>Specifications:</strong> {req.specifications}
                            </div>
                          )}
                        </div>

                        {/* Attached Blueprints & Drawings */}
                        {req.imageUrls && req.imageUrls.length > 0 && (
                          <div style={{ margin: '0.85rem 0', display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
                            <small style={{ color: '#64748b', fontWeight: 600 }}>Client Attached Blueprints &amp; Photos ({req.imageUrls.length}):</small>
                            {req.imageUrls.map((img, idx) => (
                              <img
                                key={idx}
                                src={img}
                                alt={`Plan ${idx + 1}`}
                                style={{ width: '70px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #cbd5e1', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
                                onClick={() => setPmPreviewPhotosModal(req)}
                              />
                            ))}
                          </div>
                        )}

                        {/* Activity & Review Details */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                          {/* 1. PM Engineering Notes */}
                          {req.pmReply && (
                            <div style={{ padding: '0.85rem 1.1rem', background: '#f5f3ff', borderRadius: '10px', border: '1px solid #ddd6fe' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', flexWrap: 'wrap', gap: '6px' }}>
                                <strong style={{ color: '#6d28d9', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span>️</span> Your Engineering Assessment &amp; Feasibility ({formatDate(req.pmRespondedAt)}):
                                </strong>
                                {req.pmEstimatedBudget && (
                                  <span style={{ color: '#6d28d9', fontWeight: 800, fontSize: '0.84rem', background: '#ede9fe', padding: '2px 8px', borderRadius: '4px' }}>
                                    Est. Budget: {formatMoney(req.pmEstimatedBudget)} {req.pmEstimatedDuration ? `| Timeline: ${req.pmEstimatedDuration}` : ''}
                                  </span>
                                )}
                              </div>
                              <p style={{ margin: 0, color: '#4c1d95', fontSize: '0.88rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{req.pmReply}</p>
                            </div>
                          )}

                          {/* 2. Approved Box & Down payment instructions sent */}
                          {isApproved && (
                            <div style={{ padding: '1rem 1.25rem', background: '#f0fdf4', borderRadius: '10px', border: '1.5px solid #86efac' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '6px' }}>
                                <strong style={{ color: '#15803d', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span>✓</span> Approved by Project Manager ({req.approvedBy || 'Project Manager'} on {formatDate(req.approvedAt)})
                                </strong>
                                {req.downPaymentPaid ? (
                                  <span style={{ fontSize: '0.82rem', color: '#14532d', fontWeight: 800, background: '#86efac', padding: '3px 10px', borderRadius: '4px' }}>
                                    💰 20% Down Payment Paid: {formatMoney(req.downPaymentAmount)} (Ref #{req.downPaymentRef || 'N/A'})
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 700, background: '#dcfce7', padding: '2px 8px', borderRadius: '4px' }}>
                                    ⏳ Awaiting Client Down Payment
                                  </span>
                                )}
                              </div>
                              {req.clientMessage && (
                                <div style={{ marginTop: '0.4rem', padding: '0.65rem 0.85rem', background: '#ffffff', borderRadius: '6px', border: '1px solid #bbf7d0', fontSize: '0.88rem', color: '#14532d' }}>
                                  <strong style={{ display: 'block', marginBottom: '3px', color: '#166534' }}>Delivered Client Message (Down Payment Instructions):</strong>
                                  <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{req.clientMessage}</p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* 3. Rejection Notice */}
                          {req.rejectionReason && (
                            <div style={{ padding: '0.85rem 1.1rem', background: '#fef2f2', borderRadius: '10px', border: '1px solid #fecaca' }}>
                              <strong style={{ color: '#b91c1c', fontSize: '0.88rem' }}>Rejection Reason (by {req.rejectedBy || 'Project Manager'} on {formatDate(req.rejectedAt)}):</strong>
                              <p style={{ margin: '0.25rem 0 0', color: '#7f1d1d', fontSize: '0.86rem' }}>{req.rejectionReason}</p>
                            </div>
                          )}

                          {/* 4. Started Notice */}
                          {isStarted && (
                            <div style={{ padding: '0.85rem 1.1rem', background: '#ecfdf5', borderRadius: '10px', border: '1px solid #a7f3d0' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '1rem' }}></span>
                                <strong style={{ color: '#047857', fontSize: '0.88rem' }}>Construction Active &amp; Initialized (Project ID #{req.startedProjectId})</strong>
                              </div>
                              <p style={{ margin: '0.25rem 0 0', color: '#065f46', fontSize: '0.86rem' }}>
                                Project is actively managed under Projects. Assigned Client: {req.client?.name}.
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Actions Footer */}
                        <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.75rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem', flexWrap: 'wrap' }}>
                          {/* Approve and Reject buttons when NOT yet approved or started */}
                          {!isApproved && !isStarted && (
                            <>
                              <button
                                type="button"
                                className="pm-btn"
                                style={{ padding: '0.6rem 1.25rem', fontSize: '0.88rem', background: '#dc2626', color: '#fff', borderColor: '#dc2626', fontWeight: 700, borderRadius: '8px' }}
                                onClick={() => handleOpenPmRejectModal(req)}
                              >
                                 Reject Request
                              </button>

                              <button
                                type="button"
                                className="pm-btn secondary"
                                style={{ padding: '0.6rem 1.25rem', fontSize: '0.88rem', borderRadius: '8px', fontWeight: 600 }}
                                onClick={() => handleOpenPmReplyModal(req)}
                              >
                                {req.pmReply ? '️ Update Engineering Assessment' : '️ Feasibility Assessment'}
                              </button>

                              <button
                                type="button"
                                className="pm-btn primary"
                                style={{ padding: '0.65rem 1.4rem', fontSize: '0.92rem', background: '#16a34a', borderColor: '#16a34a', fontWeight: 700, borderRadius: '8px', boxShadow: '0 2px 6px rgba(22,163,74,0.25)' }}
                                onClick={() => handleOpenPmApproveModal(req)}
                              >
                                 Approve &amp; Request Down Payment
                              </button>
                            </>
                          )}

                          {/* When Approved: Can send down payment message or start project */}
                          {isApproved && !isStarted && (
                            <>
                              <button
                                type="button"
                                className="pm-btn secondary"
                                style={{ padding: '0.6rem 1.25rem', fontSize: '0.88rem', borderRadius: '8px', fontWeight: 600, background: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe' }}
                                onClick={() => handleOpenPmDownPaymentMsgModal(req)}
                              >
                                ️ Send / Update Down Payment Message
                              </button>

                              <button
                                type="button"
                                className="pm-btn primary"
                                style={{ padding: '0.65rem 1.4rem', fontSize: '0.9rem', background: '#16a34a', borderColor: '#16a34a', fontWeight: 700, borderRadius: '8px', boxShadow: '0 2px 6px rgba(22,163,74,0.25)' }}
                                onClick={() => handleOpenStartProjectModal(req)}
                              >
                                🏗️ Initialize Construction Project {req.downPaymentPaid ? '(Payment Verified)' : ''}
                              </button>
                            </>
                          )}

                          {isStarted && (
                            <button
                              type="button"
                              className="pm-btn secondary"
                              style={{ padding: '0.55rem 1.15rem', fontSize: '0.86rem', borderRadius: '8px' }}
                              onClick={() => {
                                setSelectedProjectId(String(req.startedProjectId));
                                setTab('projects');
                              }}
                            >
                              View Assigned Project #{req.startedProjectId} →
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </section>
        )}

        {/* TAB: COMPANY CATALOG PROJECT REQUESTS */}
        {(tab === 'requests' || (tab === 'client-inquiries-requests' && clientReqSubTab === 'requests')) && (
          <section className="pm-card" style={{ padding: '1.75rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#eff6ff', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>
                  ️
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.35rem', color: '#0f172a', fontWeight: 800 }}>Company Catalog Project Requests</h2>
                  <p style={{ margin: '3px 0 0', color: '#64748b', fontSize: '0.88rem' }}>
                    Project requests based on Odiliya pre-designed company properties and catalog units.
                  </p>
                </div>
              </div>

              <span
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  background: catalogPendingCount > 0 ? '#fef3c7' : '#ecfdf5',
                  color: catalogPendingCount > 0 ? '#b45309' : '#047857',
                  border: `1px solid ${catalogPendingCount > 0 ? '#fde68a' : '#a7f3d0'}`,
                }}
              >
                {catalogPendingCount} Pending Technical Review
              </span>
            </div>

            {catalogRequests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3.5rem 1rem', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#64748b', marginTop: '1.25rem' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📋</div>
                <h3 style={{ margin: '0 0 0.5rem', color: '#1e293b', fontSize: '1.15rem' }}>No Catalog Project Requests</h3>
                <p style={{ margin: 0, fontSize: '0.88rem' }}>When clients request a project based on company catalog designs, they will appear here for engineering assessment.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.25rem' }}>
                {catalogRequests.map((req) => {
                  const isAwaitingPm = req.status === 'PENDING_PM_REVIEW' || req.status === 'FORWARDED_TO_PM' || req.status === 'PENDING_CM_REVIEW';
                  const isPmReviewed = req.status === 'PM_REVIEWED';
                  const isClientNotified = req.status === 'CLIENT_NOTIFIED';
                  const isApproved = req.status === 'APPROVED';
                  const isRejected = req.status === 'REJECTED';
                  const isStarted = req.status === 'PROJECT_STARTED';

                  // Stepper stage indicator (1 to 5)
                  const currentStep = isStarted ? 5 : isApproved ? 4 : (isPmReviewed || isClientNotified) ? 3 : isAwaitingPm ? 2 : 1;

                  return (
                    <div
                      key={req.id}
                      style={{
                        background: '#ffffff',
                        border: isStarted
                          ? '1.5px solid #10b981'
                          : isApproved
                          ? '1.5px solid #16a34a'
                          : isAwaitingPm
                          ? '1.5px solid #f59e0b'
                          : '1px solid #e2e8f0',
                        borderRadius: '16px',
                        padding: '1.5rem',
                        boxShadow: '0 3px 10px rgba(0,0,0,0.04)',
                      }}
                    >
                      {/* Top Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.85rem' }}>
                        <div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#047857', background: '#ecfdf5', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              {req.category || 'RESIDENCIES'}
                            </span>
                            <span style={{ fontSize: '0.84rem', color: '#64748b' }}>
                              Client: <strong style={{ color: '#0f172a' }}>{req.client?.name || 'Valued Client'}</strong>
                            </span>
                            {req.client?.email && (
                              <span style={{ fontSize: '0.82rem', color: '#64748b' }}>({req.client.email}{req.client?.phone ? `, ${req.client.phone}` : ''})</span>
                            )}
                          </div>

                          <h3 style={{ margin: '0.2rem 0', color: '#0f172a', fontSize: '1.3rem', fontWeight: 800 }}>{req.title}</h3>

                          <div style={{ display: 'flex', gap: '1rem', color: '#64748b', fontSize: '0.85rem', marginTop: '4px' }}>
                            <span> Location: <strong style={{ color: '#334155' }}>{req.location || 'N/A'}</strong></span>
                            <span> Target Start: <strong style={{ color: '#334155' }}>{req.targetStartDate ? formatDate(req.targetStartDate) : 'Flexible'}</strong></span>
                          </div>
                        </div>

                        {/* Status badge */}
                        <div>
                          {isAwaitingPm && (
                            <span style={{ padding: '0.4rem 0.9rem', borderRadius: '20px', background: '#fef3c7', color: '#b45309', fontWeight: 700, fontSize: '0.82rem', border: '1px solid #fde68a', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                              ⏳ Action Needed (Review &amp; Reply)
                            </span>
                          )}
                          {isPmReviewed && (
                            <span style={{ padding: '0.4rem 0.9rem', borderRadius: '20px', background: '#eff6ff', color: '#1e40af', fontWeight: 700, fontSize: '0.82rem', border: '1px solid #bfdbfe' }}>
                               Engineering Review Submitted
                            </span>
                          )}
                          {isClientNotified && (
                            <span style={{ padding: '0.4rem 0.9rem', borderRadius: '20px', background: '#f0fdf4', color: '#16a34a', fontWeight: 700, fontSize: '0.82rem', border: '1px solid #bbf7d0' }}>
                              Client Notified by CM
                            </span>
                          )}
                          {isApproved && (
                            <span style={{ padding: '0.4rem 0.9rem', borderRadius: '20px', background: '#dcfce7', color: '#166534', fontWeight: 700, fontSize: '0.82rem', border: '1px solid #86efac', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                               Approved by Client Manager — Ready to Start
                            </span>
                          )}
                          {isStarted && (
                            <span style={{ padding: '0.4rem 0.9rem', borderRadius: '20px', background: '#ecfdf5', color: '#047857', border: '1.5px solid #10b981', fontWeight: 800, fontSize: '0.84rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                               Project Started (ID #{req.startedProjectId})
                            </span>
                          )}
                          {isRejected && (
                            <span style={{ padding: '0.4rem 0.9rem', borderRadius: '20px', background: '#fee2e2', color: '#b91c1c', fontWeight: 700, fontSize: '0.82rem', border: '1px solid #fca5a5' }}>
                               Scope Rejected
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Visual Workflow Stepper */}
                      <div style={{ margin: '1rem 0', background: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          {[
                            { step: 1, label: '1. Client Requested' },
                            { step: 2, label: '2. Forwarded to PM' },
                            { step: 3, label: '3. Engineering Assessed' },
                            { step: 4, label: '4. CM Approved' },
                            { step: 5, label: '5. Construction Active' },
                          ].map((s) => {
                            const isDone = currentStep >= s.step;
                            const isCurrent = currentStep === s.step;
                            return (
                              <div key={s.step} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}>
                                <span
                                  style={{
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '50%',
                                    background: isDone ? '#047857' : '#e2e8f0',
                                    color: isDone ? '#ffffff' : '#64748b',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 700,
                                    fontSize: '0.7rem',
                                  }}
                                >
                                  {isDone ? '' : s.step}
                                </span>
                                <span style={{ fontWeight: isCurrent ? 800 : isDone ? 600 : 400, color: isCurrent ? '#047857' : isDone ? '#0f172a' : '#94a3b8' }}>
                                  {s.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Project Overview Mini-Tiles */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', margin: '1rem 0' }}>
                        <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                          <small style={{ color: '#64748b', display: 'block', fontSize: '0.76rem', fontWeight: 600 }}>Client Expected Budget</small>
                          <strong style={{ color: '#047857', fontSize: '1.15rem', display: 'block', marginTop: '2px' }}>
                            {req.expectedBudget ? formatMoney(req.expectedBudget) : 'Custom Quote'}
                          </strong>
                        </div>

                        <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                          <small style={{ color: '#64748b', display: 'block', fontSize: '0.76rem', fontWeight: 600 }}>Project Location</small>
                          <strong style={{ color: '#0f172a', fontSize: '1rem', display: 'block', marginTop: '2px' }}>
                             {req.location || 'Not Specified'}
                          </strong>
                        </div>

                        <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                          <small style={{ color: '#64748b', display: 'block', fontSize: '0.76rem', fontWeight: 600 }}>Target Start Date</small>
                          <strong style={{ color: '#0f172a', fontSize: '1rem', display: 'block', marginTop: '2px' }}>
                             {req.targetStartDate ? formatDate(req.targetStartDate) : 'Flexible'}
                          </strong>
                        </div>
                      </div>

                      {/* Client Requirements & Specifications */}
                      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem', margin: '0.85rem 0' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '4px' }}>
                          Client Scope &amp; Requirements:
                        </div>
                        <p style={{ margin: 0, color: '#1e3a8a', fontSize: '0.92rem', lineHeight: 1.5 }}>
                          {req.description}
                        </p>
                        {req.specifications && (
                          <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed #e2e8f0', fontSize: '0.86rem', color: '#475569' }}>
                            <strong>Specifications:</strong> {req.specifications}
                          </div>
                        )}
                      </div>

                      {/* Attached Blueprints & Drawings */}
                      {req.imageUrls && req.imageUrls.length > 0 && (
                        <div style={{ margin: '0.85rem 0', display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
                          <small style={{ color: '#64748b', fontWeight: 600 }}>Attached Drawings &amp; Photos ({req.imageUrls.length}):</small>
                          {req.imageUrls.map((img, idx) => (
                            <img
                              key={idx}
                              src={img}
                              alt={`Plan ${idx + 1}`}
                              style={{ width: '70px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #cbd5e1', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
                              onClick={() => setPmPreviewPhotosModal(req)}
                            />
                          ))}
                        </div>
                      )}

                      {/* Structured Activity & Review Feed */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                        {/* 1. Client Manager's Forwarding Notes */}
                        {req.cmNotes && (
                          <div style={{ padding: '0.85rem 1.1rem', background: '#eff6ff', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                              <strong style={{ color: '#1d4ed8', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span></span> Client Manager Instructions ({req.forwardedByCm || 'Client Manager'}):
                              </strong>
                              <small style={{ color: '#64748b' }}>{formatDate(req.forwardedToPmAt)}</small>
                            </div>
                            <p style={{ margin: 0, color: '#1e3a8a', fontSize: '0.88rem', lineHeight: 1.5 }}>{req.cmNotes}</p>
                          </div>
                        )}

                        {/* 2. Your Engineering Review */}
                        {req.pmReply && (
                          <div style={{ padding: '0.85rem 1.1rem', background: '#f5f3ff', borderRadius: '10px', border: '1px solid #ddd6fe' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', flexWrap: 'wrap', gap: '6px' }}>
                              <strong style={{ color: '#6d28d9', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span>️</span> Your Engineering Assessment &amp; Feasibility ({formatDate(req.pmRespondedAt)}):
                              </strong>
                              {req.pmEstimatedBudget && (
                                <span style={{ color: '#6d28d9', fontWeight: 800, fontSize: '0.84rem', background: '#ede9fe', padding: '2px 8px', borderRadius: '4px' }}>
                                  Est. Budget: {formatMoney(req.pmEstimatedBudget)} {req.pmEstimatedDuration ? `| Timeline: ${req.pmEstimatedDuration}` : ''}
                                </span>
                              )}
                            </div>
                            <p style={{ margin: 0, color: '#4c1d95', fontSize: '0.88rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{req.pmReply}</p>
                          </div>
                        )}

                        {/* 3. Construction Active Notice */}
                        {isStarted && (
                          <div style={{ padding: '0.85rem 1.1rem', background: '#ecfdf5', borderRadius: '10px', border: '1px solid #a7f3d0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '1rem' }}></span>
                              <strong style={{ color: '#047857', fontSize: '0.88rem' }}>Construction Project Initialized &amp; Active</strong>
                            </div>
                            <p style={{ margin: '0.25rem 0 0', color: '#065f46', fontSize: '0.86rem' }}>
                              Project ID #{req.startedProjectId} is actively managed under Projects. Client {req.client?.name} is assigned.
                            </p>
                          </div>
                        )}

                        {/* 4. Approved but not started Notice */}
                        {isApproved && !isStarted && (
                          <div style={{ padding: '0.85rem 1.1rem', background: '#f0fdf4', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', flexWrap: 'wrap', gap: '6px' }}>
                              <strong style={{ color: '#15803d', fontSize: '0.88rem' }}>✓ Approved ({req.approvedBy || 'Project Manager'} on {formatDate(req.approvedAt)})</strong>
                              {req.downPaymentPaid ? (
                                <span style={{ fontSize: '0.8rem', color: '#14532d', fontWeight: 800, background: '#86efac', padding: '2px 8px', borderRadius: '4px' }}>
                                  💰 Down Payment Paid: {formatMoney(req.downPaymentAmount)} (Ref #{req.downPaymentRef || 'N/A'})
                                </span>
                              ) : (
                                <span style={{ fontSize: '0.78rem', color: '#166534', fontWeight: 700, background: '#dcfce7', padding: '2px 8px', borderRadius: '4px' }}>
                                  ⏳ Awaiting Client Down Payment
                                </span>
                              )}
                            </div>
                            <p style={{ margin: '0.25rem 0 0', color: '#166534', fontSize: '0.86rem' }}>
                              This project request has received official sign-off! You can now initialize the project and assign this client.
                            </p>
                          </div>
                        )}

                        {/* 5. Rejection Notice */}
                        {req.rejectionReason && (
                          <div style={{ padding: '0.85rem 1.1rem', background: '#fef2f2', borderRadius: '10px', border: '1px solid #fecaca' }}>
                            <strong style={{ color: '#b91c1c', fontSize: '0.88rem' }}>Rejection Reason (by {req.rejectedBy || 'CM'} on {formatDate(req.rejectedAt)}):</strong>
                            <p style={{ margin: '0.25rem 0 0', color: '#7f1d1d', fontSize: '0.86rem' }}>{req.rejectionReason}</p>
                          </div>
                        )}
                      </div>

                      {/* Actions Footer */}
                      <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.75rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem', flexWrap: 'wrap' }}>
                        {!isApproved && !isStarted && !isRejected && (
                          <>
                            <button
                              type="button"
                              className="pm-btn secondary"
                              style={{ padding: '0.6rem 1.1rem', fontSize: '0.86rem', borderRadius: '8px', borderColor: '#ef4444', color: '#ef4444', background: '#fff' }}
                              onClick={() => handleOpenPmRejectModal(req)}
                            >
                              ✕ Decline Specification
                            </button>
                            <button
                              type="button"
                              className="pm-btn secondary"
                              style={{ padding: '0.6rem 1.25rem', fontSize: '0.88rem', borderRadius: '8px', fontWeight: 600 }}
                              onClick={() => handleOpenPmReplyModal(req)}
                            >
                              {req.pmReply ? '✏️ Update Engineering Assessment' : '📐 Feasibility Assessment'}
                            </button>
                            <button
                              type="button"
                              className="pm-btn primary"
                              style={{ padding: '0.65rem 1.4rem', fontSize: '0.92rem', background: '#16a34a', borderColor: '#16a34a', fontWeight: 700, borderRadius: '8px', boxShadow: '0 2px 6px rgba(22,163,74,0.25)' }}
                              onClick={() => handleOpenPmApproveModal(req)}
                            >
                              ✓ Approve &amp; Request Down Payment
                            </button>
                          </>
                        )}

                        {isApproved && !isStarted && (
                          <>
                            <button
                              type="button"
                              className="pm-btn secondary"
                              style={{ padding: '0.6rem 1.25rem', fontSize: '0.88rem', borderRadius: '8px', fontWeight: 600, background: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe' }}
                              onClick={() => handleOpenPmDownPaymentMsgModal(req)}
                            >
                              ✉️ Send / Update Down Payment Message
                            </button>
                            <button
                              type="button"
                              className="pm-btn primary"
                              style={{ padding: '0.65rem 1.4rem', fontSize: '0.9rem', background: '#16a34a', borderColor: '#16a34a', fontWeight: 700, borderRadius: '8px', boxShadow: '0 2px 6px rgba(22,163,74,0.25)' }}
                              onClick={() => handleOpenStartProjectModal(req)}
                            >
                              🏗️ Initialize Construction Project {req.downPaymentPaid ? '(Payment Verified)' : ''}
                            </button>
                          </>
                        )}

                        {isStarted && (
                          <button
                            type="button"
                            className="pm-btn secondary"
                            style={{ padding: '0.55rem 1.15rem', fontSize: '0.86rem', borderRadius: '8px' }}
                            onClick={() => {
                              setSelectedProjectId(String(req.startedProjectId));
                              setTab('projects');
                            }}
                          >
                            View Assigned Project #{req.startedProjectId} →
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* TAB 2: PROJECTS */}
        {tab === 'projects' && (
          <section className="pm-two-column">
            <FormCard title={editingProject ? 'Edit project' : 'Create project'}>
              <form onSubmit={saveProject} className="pm-form">
                <div style={{ padding: '0.65rem 0.85rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', fontSize: '0.84rem', color: '#166534', marginBottom: '0.75rem' }}>
                  <strong>Internal Construction Project:</strong> Visible exclusively to project staff and the assigned client. Not published on the public showcase.
                </div>
                <input
                  placeholder="Project name"
                  value={projectForm.name}
                  onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                  required
                />
                <label>
                  Property design type
                  <select
                    value={projectForm.category}
                    onChange={(e) => setProjectForm({ ...projectForm, category: e.target.value })}
                    required
                  >
                    <option value="">-- Select Property Type --</option>
                    <option value="RESIDENCIES">Residencies</option>
                    <option value="APARTMENTS">Apartments</option>
                    <option value="LANDS">Land / Plot</option>
                  </select>
                </label>
                <select
                  value={projectForm.clientId}
                  onChange={(e) => setProjectForm({ ...projectForm, clientId: e.target.value })}
                >
                  <option value="">-- Choose Assigned Client (Optional) --</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} ({client.email})
                    </option>
                  ))}
                </select>
                <input
                  placeholder="Location (e.g. Colombo 03, Negombo)"
                  value={projectForm.location || ''}
                  onChange={(e) => setProjectForm({ ...projectForm, location: e.target.value })}
                />
                <textarea
                  placeholder="Project description"
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                />

                {/* Project Image: URL or Upload */}
                <label>
                  Project Image (URL or File Upload)
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.25rem' }}>
                    <input
                      placeholder="Paste image URL (https://...)"
                      value={projectForm.imageUrl || ''}
                      onChange={(e) => setProjectForm({ ...projectForm, imageUrl: e.target.value })}
                      style={{ flex: 1 }}
                    />
                    <label className="pm-secondary" style={{ padding: '0.55rem 0.85rem', cursor: 'pointer', margin: 0, fontSize: '0.82rem', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      Upload
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              const dataUrl = await readImageAsDataUrl(file);
                              setProjectForm((prev) => ({ ...prev, imageUrl: dataUrl }));
                            } catch (err) {
                              fail(err);
                            }
                          }
                        }}
                      />
                    </label>
                  </div>
                </label>
                {projectForm.imageUrl && (
                  <div style={{ position: 'relative', width: '100%', height: '140px', overflow: 'hidden', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '0.75rem' }}>
                    <img src={projectForm.imageUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      type="button"
                      onClick={() => setProjectForm({ ...projectForm, imageUrl: '' })}
                      style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(0,0,0,0.65)', color: '#fff', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}
                    >
                      ×
                    </button>
                  </div>
                )}

                {/* Additional Construction & Specifications Details */}
                <label>
                  Construction Status Detail
                  <input
                    placeholder="e.g. Foundation Complete, Level 3 Slabs, Interior Finishes"
                    value={projectForm.constructionStatus || ''}
                    onChange={(e) => setProjectForm({ ...projectForm, constructionStatus: e.target.value })}
                  />
                </label>

                <label>
                  Price Range / Estimate
                  <input
                    placeholder="e.g. LKR 45,000,000 - 55,000,000"
                    value={projectForm.priceRange || ''}
                    onChange={(e) => setProjectForm({ ...projectForm, priceRange: e.target.value })}
                  />
                </label>

                <label>
                  Project Specifications &amp; Architectural Details
                  <textarea
                    rows={3}
                    placeholder="e.g. 4 Bedrooms, 3 Bathrooms, 3,200 sqft, Rooftop Terrace, Solar Panels, 2 Car Garage"
                    value={projectForm.specifications || ''}
                    onChange={(e) => setProjectForm({ ...projectForm, specifications: e.target.value })}
                  />
                </label>

                <label>
                  Start date
                  <input
                    type="date"
                    min={getTodayDateString()}
                    value={projectForm.startDate}
                    onChange={(e) => setProjectForm({ ...projectForm, startDate: e.target.value })}
                    required
                  />
                </label>
                <label>
                  End date
                  <input
                    type="date"
                    min={projectForm.startDate || getTodayDateString()}
                    value={projectForm.endDate}
                    onChange={(e) => setProjectForm({ ...projectForm, endDate: e.target.value })}
                  />
                </label>
                <label>
                  Project budget (LKR)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={projectForm.budget}
                    onChange={(e) => setProjectForm({ ...projectForm, budget: e.target.value })}
                    required
                  />
                </label>
                <label>
                  Project status
                  <select
                    value={projectForm.status}
                    onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value })}
                    required
                  >
                    <option value="">-- Select Status --</option>
                    {statuses.map((status) => (
                      <option key={status} value={status}>{status.replace('_', ' ')}</option>
                    ))}
                  </select>
                </label>
                {editingProject && (
                  <label>
                    Progress ({projectForm.progressPercentage || 0}%)
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={projectForm.progressPercentage}
                      onChange={(e) => setProjectForm({ ...projectForm, progressPercentage: e.target.value })}
                    />
                  </label>
                )}
                <button className="pm-primary">{editingProject ? 'Save project changes' : 'Create project'}</button>
                {editingProject && (
                  <div className="pm-form-actions">
                    <button type="button" className="pm-secondary" onClick={startProject}>
                      New project
                    </button>
                    <button type="button" className="pm-danger-button" onClick={removeProject}>
                      Delete project
                    </button>
                  </div>
                )}
                {editingProject && (
                  <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid #e2e8f0' }}>
                    <button
                      type="button"
                      onClick={() => handleDownloadProjectPdf(editingProject)}
                      style={{
                        width: '100%',
                        padding: '9px 16px',
                        background: '#ecfdf5',
                        color: '#047857',
                        border: '1.5px solid #10b981',
                        borderRadius: '8px',
                        fontWeight: 700,
                        fontSize: '0.86rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                      }}
                    >
                       Download Project Dossier (PDF)
                    </button>
                  </div>
                )}
              </form>
            </FormCard>
            <FormCard title="All projects">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem', background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>Filter by category:</label>
                  <select
                    value={projectFilterCategory}
                    onChange={(e) => setProjectFilterCategory(e.target.value)}
                    style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                  >
                    <option value="ALL">All Categories ({projects.length})</option>
                    <option value="RESIDENCIES">Residencies ({projects.filter((p) => p.category === 'RESIDENCIES').length})</option>
                    <option value="APARTMENTS">Apartments ({projects.filter((p) => p.category === 'APARTMENTS').length})</option>
                    <option value="LANDS">Lands &amp; Plots ({projects.filter((p) => p.category === 'LANDS').length})</option>
                  </select>
                </div>
                <div style={{ flex: '1 1 180px', maxWidth: '240px' }}>
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={projectSearchQuery}
                    onChange={(e) => setProjectSearchQuery(e.target.value)}
                    style={{ width: '100%', padding: '5px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                  />
                </div>
              </div>

              {(() => {
                const filteredProjects = projects.filter((p) => {
                  if (projectFilterCategory !== 'ALL' && p.category !== projectFilterCategory) return false;
                  if (projectSearchQuery.trim()) {
                    const q = projectSearchQuery.toLowerCase();
                    const nameMatch = p.name?.toLowerCase().includes(q);
                    const clientMatch = p.client?.name?.toLowerCase().includes(q);
                    const locMatch = p.location?.toLowerCase().includes(q);
                    if (!nameMatch && !clientMatch && !locMatch) return false;
                  }
                  return true;
                });

                return (
                  <ProjectTable
                    projects={filteredProjects}
                    spentByProject={spentByProject}
                    onEdit={editProject}
                    onDownloadPdf={handleDownloadProjectPdf}
                    emptyMessage="No projects match the current filter."
                  />
                );
              })()}
            </FormCard>
          </section>
        )}

        {/* TAB 3: ASSIGN CLIENTS */}
        {tab === 'clients' && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#111827', fontSize: '1.4rem' }}>Assign Clients to Projects</h2>
              <p style={{ color: '#6b7280', margin: '6px 0 0' }}>Link registered clients to their corresponding construction projects and track agreements.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
              {/* Form to Assign Client */}
              <FormCard title="Assign Client">
                <form onSubmit={handleAssignClient} className="pm-form">
                  <label>
                    Select Project
                    <select
                      value={clientAssignProject}
                      onChange={(e) => setClientAssignProject(e.target.value)}
                      required
                    >
                      <option value="">-- Choose Project --</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.status} - Currently: {p.client?.name || 'No Client'})
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Select Client
                    <select
                      value={clientAssignClient}
                      onChange={(e) => setClientAssignClient(e.target.value)}
                    >
                      <option value="">-- No Client (Remove Assignment) --</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.email}) {c.phone ? `· ${c.phone}` : ''}
                        </option>
                      ))}
                    </select>
                  </label>

                  {clientAssignClient && (() => {
                    const chosen = clients.find((c) => String(c.id) === String(clientAssignClient));
                    if (!chosen) return null;
                    return (
                      <div style={{ padding: '12px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', fontSize: '0.85rem', color: '#166534' }}>
                        <div><strong>Client:</strong> {chosen.name}</div>
                        <div><strong>Email:</strong> {chosen.email}</div>
                        <div><strong>Phone:</strong> {chosen.phone || 'N/A'}</div>
                        <div><strong>Status:</strong> {chosen.status}</div>
                      </div>
                    );
                  })()}

                  <button type="submit" className="pm-primary" disabled={savingClientAssign}>
                    {savingClientAssign ? 'Saving...' : 'Assign Client to Project'}
                  </button>
                </form>
              </FormCard>

              {/* Project Client Mapping Table */}
              <FormCard title="Current Project & Client Allocations">
                <div className="pm-table-wrap">
                  <table className="pm-table">
                    <thead>
                      <tr>
                        <th>Project</th>
                        <th>Assigned Client</th>
                        <th>Budget</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projects.map((p) => (
                        <tr key={p.id}>
                          <td>
                            <strong>{p.name}</strong>
                            <small>{p.location || 'Location not set'}</small>
                          </td>
                          <td>
                            {p.client ? (
                              <div>
                                <span style={{ fontWeight: 600, color: '#047857' }}>{p.client.name}</span>
                                <small>{p.client.email}</small>
                              </div>
                            ) : (
                              <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Unassigned</span>
                            )}
                          </td>
                          <td>{formatMoney(p.budget)}</td>
                          <td><Status value={p.status} /></td>
                          <td>
                            <button
                              type="button"
                              className="pm-text-button"
                              onClick={() => {
                                setClientAssignProject(String(p.id));
                                setClientAssignClient(p.client?.id ? String(p.client.id) : '');
                              }}
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </FormCard>
            </div>
          </div>
        )}

        {/* TAB 4: ASSIGN EMPLOYEES (PM Feature matching requirement 1 & 2) */}
        {tab === 'assignments' && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#111827', fontSize: '1.4rem' }}>Assign Employees to Projects</h2>
              <p style={{ color: '#6b7280', margin: '6px 0 0' }}>Allocate site engineers, masons, electricians, and trade workers to active construction sites.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
              {/* Left: Select Employee */}
              <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <h3 style={{ margin: '0 0 12px', color: '#111827', fontSize: '1.2rem' }}>
                  Select Employee to Assign Projects
                </h3>
                <p style={{ color: '#6b7280', fontSize: '0.85rem', margin: '0 0 16px' }}>
                  Choose an employee below to manage their construction site allocations.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '480px', overflowY: 'auto' }}>
                  {employees.map((emp) => {
                    const isSelected = selectedEmpForAssign?.id === emp.id;
                    const projectCount = emp.assignedProjects ? emp.assignedProjects.length : (emp.project ? 1 : 0);
                    return (
                      <div
                        key={emp.id}
                        onClick={() => openEmpAssignment(emp)}
                        style={{
                          padding: '12px 16px',
                          borderRadius: '8px',
                          border: isSelected ? '2px solid #047857' : '1px solid #e5e7eb',
                          background: isSelected ? '#ecfdf5' : '#ffffff',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, color: '#111827' }}>
                            {emp.name}{' '}
                            <span style={{ fontSize: '0.75rem', background: '#e0e7ff', color: '#3730a3', padding: '2px 6px', borderRadius: '4px' }}>
                              {emp.employeeId || 'STAFF'}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                            Trade: <b>{emp.role || emp.position}</b>
                          </div>
                        </div>
                        <span style={{ fontSize: '0.8rem', color: projectCount > 0 ? '#047857' : '#9ca3af', fontWeight: 600 }}>
                          {projectCount} project(s)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right: Project Checkboxes */}
              <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                {selectedEmpForAssign ? (
                  <form onSubmit={saveEmpAssignments}>
                    <h3 style={{ margin: '0 0 4px', color: '#111827', fontSize: '1.2rem' }}>
                      Assign Projects to {selectedEmpForAssign.name}
                    </h3>
                    <p style={{ color: '#6b7280', fontSize: '0.85rem', margin: '0 0 16px' }}>
                      Role: <b>{selectedEmpForAssign.role || selectedEmpForAssign.position}</b> ({selectedEmpForAssign.employeeId || 'Staff'})
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                      {projects.length === 0 ? (
                        <p style={{ color: '#6b7280' }}>No active construction projects available.</p>
                      ) : (
                        projects.map((proj) => {
                          const checked = assignedProjectIds.includes(proj.id);
                          return (
                            <div
                              key={proj.id}
                              onClick={() => toggleProjectForEmp(proj.id)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '12px 14px',
                                borderRadius: '8px',
                                border: checked ? '1.5px solid #059669' : '1px solid #e5e7eb',
                                background: checked ? '#f0fdf4' : '#ffffff',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  toggleProjectForEmp(proj.id);
                                }}
                                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#059669' }}
                              />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  {proj.name}
                                  {checked && (
                                    <span style={{ fontSize: '0.72rem', background: '#d1fae5', color: '#065f46', padding: '2px 7px', borderRadius: '999px', fontWeight: 700 }}>
                                      Assigned
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '2px' }}>
                                  Status: {proj.status} | Client: {proj.client?.name || 'Odiliya In-House'}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={savingEmpAssign}
                      style={{
                        padding: '10px 22px',
                        background: '#047857',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        cursor: savingEmpAssign ? 'not-allowed' : 'pointer',
                        opacity: savingEmpAssign ? 0.75 : 1,
                        boxShadow: '0 2px 4px rgba(4,120,87,0.2)',
                      }}
                    >
                      {savingEmpAssign ? 'Saving…' : 'Save Project Assignments'}
                    </button>
                  </form>
                ) : (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
                    <p style={{ fontWeight: 500 }}>Select an employee from the left panel to assign projects.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: TASKS & ASSIGNMENTS (Screenshot 2 left) */}
        {tab === 'tasks' && (
          <div>
            <ProjectSelector />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
              <FormCard title="Tasks & assignments">
                <form onSubmit={saveTask} className="pm-form">
                  <input
                    placeholder="Task name"
                    value={taskForm.taskName}
                    onChange={(e) => setTaskForm({ ...taskForm, taskName: e.target.value })}
                    required
                  />
                  <textarea
                    placeholder="Description"
                    value={taskForm.description}
                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  />
                  <label>
                    Assigned Employee
                    <select
                      value={taskForm.assignedEmployeeId}
                      onChange={(e) => setTaskForm({ ...taskForm, assignedEmployeeId: e.target.value })}
                    >
                      <option value="">-- Select Employee (Optional) --</option>
                      {employees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.name} ({employee.role || employee.position || 'Staff'})
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Start date
                    <input
                      type="date"
                      min={getTodayDateString()}
                      value={taskForm.startDate}
                      onChange={(e) => setTaskForm({ ...taskForm, startDate: e.target.value })}
                      required
                    />
                  </label>
                  <label>
                    Deadline
                    <input
                      type="date"
                      min={taskForm.startDate || getTodayDateString()}
                      value={taskForm.deadline}
                      onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })}
                      required
                    />
                  </label>
                  <label>
                    Status
                    <select
                      value={taskForm.status || 'TODO'}
                      onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                    >
                      <option value="TODO">TODO</option>
                      <option value="IN_PROGRESS">IN_PROGRESS</option>
                      <option value="IN_REVIEW">IN_REVIEW</option>
                      <option value="COMPLETED">COMPLETED</option>
                    </select>
                  </label>
                  <button className="pm-primary">Assign task</button>
                </form>
              </FormCard>

              <FormCard title={`Tasks for ${activeProject?.name || 'Project'}`}>
                <TaskTable tasks={projectTasks} completeTask={completeTask} />
              </FormCard>
            </div>
          </div>
        )}

        {/* TAB 6: MILESTONES (Screenshot 2 right) */}
        {tab === 'milestones' && (
          <div>
            <ProjectSelector />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
              <FormCard title="Add Project Milestone">
                <form onSubmit={saveMilestone} className="pm-form">
                  <input
                    placeholder="Milestone name (e.g. Foundation Complete)"
                    value={milestoneForm.title}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
                    required
                  />
                  <textarea
                    placeholder="Description"
                    value={milestoneForm.description}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
                  />
                  <label>
                    Target Date
                    <input
                      type="date"
                      min={getTodayDateString()}
                      value={milestoneForm.targetDate}
                      onChange={(e) => setMilestoneForm({ ...milestoneForm, targetDate: e.target.value })}
                    />
                  </label>
                  <label>
                    Completion Percentage ({milestoneForm.progressPercentage}%)
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={milestoneForm.progressPercentage}
                      onChange={(e) => setMilestoneForm({ ...milestoneForm, progressPercentage: e.target.value })}
                    />
                  </label>
                  <button className="pm-primary">Add milestone</button>
                </form>
              </FormCard>

              <FormCard title={`Milestones for ${activeProject?.name || 'Project'}`}>
                {activeProject?.milestones && activeProject.milestones.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {activeProject.milestones.map((milestone) => (
                      <div className="pm-milestone" key={milestone.id}>
                        <div>
                          <strong>{milestone.title}</strong>
                          <small>{formatDate(milestone.targetDate)}</small>
                          {milestone.description && <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#64748b' }}>{milestone.description}</p>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Status value={milestone.status} />
                          <b>{milestone.progressPercentage}%</b>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState message="No milestones scheduled for this project yet." />
                )}
              </FormCard>
            </div>
          </div>
        )}

        {/* TAB 7: BUDGET & EXPENSES (Screenshot 3 left) */}
        {tab === 'budget' && (
          <div>
            <ProjectSelector />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
              <FormCard title="Budget & expenses">
                <form onSubmit={saveExpense} className="pm-form">
                  <input
                    placeholder="Expense description (e.g. Timber delivery)"
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                    required
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Amount (LKR)"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    required
                  />
                  <input
                    type="date"
                    min={getTodayDateString()}
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                    required
                  />
                  <button className="pm-primary">Save expense</button>
                </form>
              </FormCard>

              <FormCard title={`Expenses Log: ${activeProject?.name || 'Project'}`}>
                {projectExpenses.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {projectExpenses.map((expense) => (
                      <div className="pm-milestone" key={expense.id}>
                        <div>
                          <strong>{expense.description}</strong>
                          <small>{formatDate(expense.date)} · <b style={{ color: '#047857' }}>{formatMoney(expense.amount)}</b></small>
                        </div>
                        <button className="pm-text-button danger" onClick={() => removeExpense(expense.id)}>
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState message="No expenses recorded for this project yet." />
                )}
              </FormCard>
            </div>
          </div>
        )}

        {/* TAB 8: PROJECT TEAM (Screenshot 3 right) */}
        {tab === 'team' && (
          <div>
            <ProjectSelector />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
              <FormCard title="Add Employee to Project Team">
                <form onSubmit={saveEmployee} className="pm-form">
                  <input
                    placeholder="Employee name"
                    value={employeeForm.name}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email address"
                    value={employeeForm.email}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                  />
                  <input
                    placeholder="Role / trade (e.g. Mason, Electrician)"
                    value={employeeForm.role}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, role: e.target.value })}
                  />
                  <button className="pm-primary">Add employee</button>
                </form>
              </FormCard>

              <FormCard title={`Team for ${activeProject?.name || 'Project'}`}>
                {projectEmployees.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {projectEmployees.map((employee) => (
                      <div className="pm-milestone" key={employee.id}>
                        <div>
                          <strong style={{ fontSize: '0.98rem' }}>{employee.name}</strong>
                          <small>{employee.role || employee.position || 'Site Staff'} · {employee.email || 'No email'}</small>
                        </div>
                        <span style={{ fontSize: '0.75rem', background: '#e0e7ff', color: '#3730a3', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
                          {employee.employeeId || 'STAFF'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState message="No team members assigned to this project yet. Use the form or 'Assign Employees' tab to allocate staff." />
                )}
              </FormCard>
            </div>
          </div>
        )}

        {/* PM TECHNICAL REPLY MODAL */}
        {pmReplyModalOpen && pmReplyTarget && (
          <div className="light-modal-overlay">
            <div className="light-modal-box" style={{ maxWidth: '650px' }}>
              <div className="modal-head-row">
                <div>
                  <span className="brand-green-subtitle" style={{ fontSize: '0.8rem' }}>PROJECT ENGINEERING ASSESSMENT</span>
                  <h3 style={{ margin: '0.2rem 0 0' }}>Technical Reply for: {pmReplyTarget.title}</h3>
                </div>
                <button type="button" onClick={() => { setPmReplyModalOpen(false); setPmReplyTarget(null); }}>×</button>
              </div>

              <form onSubmit={handleSubmitPmReply} style={{ marginTop: '1.25rem' }}>
                <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #e2e8f0', fontSize: '0.88rem' }}>
                  <p style={{ margin: '0 0 0.35rem' }}><strong>Client:</strong> {pmReplyTarget.client?.name} &nbsp;|&nbsp; <strong>Location:</strong> {pmReplyTarget.location}</p>
                  <p style={{ margin: '0 0 0.35rem' }}><strong>Client Expected Budget:</strong> {pmReplyTarget.expectedBudget ? formatMoney(pmReplyTarget.expectedBudget) : 'N/A'}</p>
                  {pmReplyTarget.cmNotes && (
                    <div style={{ marginTop: '0.4rem', padding: '0.5rem', background: '#eff6ff', borderRadius: '4px', color: '#1e3a8a', fontSize: '0.83rem' }}>
                      <strong>CM Note:</strong> {pmReplyTarget.cmNotes}
                    </div>
                  )}
                </div>

                <div className="form-input-box">
                  <label>Engineering Feasibility &amp; Technical Assessment *</label>
                  <textarea
                    rows={5}
                    value={pmReplyForm.pmReply}
                    onChange={(e) => setPmReplyForm({ ...pmReplyForm, pmReply: e.target.value })}
                    placeholder="Describe structural assessment, site clearance recommendations, soil suitability, material availability, and technical comments..."
                    required
                  />
                </div>

                <div className="form-grid-2" style={{ marginTop: '1rem' }}>
                  <div className="form-input-box">
                    <label>PM Estimated Construction Cost (LKR)</label>
                    <input
                      type="number"
                      min="0"
                      step="10000"
                      placeholder="e.g. 26000000"
                      value={pmReplyForm.pmEstimatedBudget}
                      onChange={(e) => setPmReplyForm({ ...pmReplyForm, pmEstimatedBudget: e.target.value })}
                    />
                  </div>

                  <div className="form-input-box">
                    <label>Estimated Construction Duration</label>
                    <input
                      type="text"
                      placeholder="e.g. 8 - 10 Months"
                      value={pmReplyForm.pmEstimatedDuration}
                      onChange={(e) => setPmReplyForm({ ...pmReplyForm, pmEstimatedDuration: e.target.value })}
                    />
                  </div>
                </div>

                <small style={{ display: 'block', color: 'var(--text-muted)', marginTop: '0.6rem', fontSize: '0.82rem' }}>
                  This technical evaluation will be returned to the Client Manager so they can compile the official proposal for the client.
                </small>

                <div className="modal-actions-row" style={{ marginTop: '1.5rem' }}>
                  <button type="button" className="btn-outline-green" onClick={() => { setPmReplyModalOpen(false); setPmReplyTarget(null); }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-solid-green" disabled={submittingPmReply}>
                    {submittingPmReply ? 'Submitting Reply...' : 'Transmit Reply to Client Manager'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* PM PREVIEW PHOTOS MODAL */}
        {pmPreviewPhotosModal && (
          <div className="light-modal-overlay">
            <div className="light-modal-box" style={{ maxWidth: '750px' }}>
              <div className="modal-head-row">
                <h3>Drawings &amp; Photos — {pmPreviewPhotosModal.title}</h3>
                <button type="button" onClick={() => setPmPreviewPhotosModal(null)}>×</button>
              </div>
              <div className="modal-body-content" style={{ marginTop: '1rem' }}>
                <p style={{ color: '#64748b', marginBottom: '1rem' }}>
                  Client: <b>{pmPreviewPhotosModal.client?.name}</b> | Location: <b>{pmPreviewPhotosModal.location}</b>
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
                  {(pmPreviewPhotosModal.imageUrls || []).map((img, idx) => (
                    <a key={idx} href={img} target="_blank" rel="noopener noreferrer">
                      <img src={img} alt={`Drawing ${idx + 1}`} style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                    </a>
                  ))}
                </div>
              </div>
              <div className="modal-actions-row" style={{ marginTop: '1.5rem' }}>
                <button type="button" className="btn-solid-green" onClick={() => setPmPreviewPhotosModal(null)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* PM APPROVE CUSTOM DESIGN MODAL (WITH DOWN PAYMENT MESSAGE) */}
        {pmApproveModalOpen && pmApproveTarget && (
          <div className="light-modal-overlay">
            <div className="light-modal-box" style={{ maxWidth: '680px' }}>
              <div className="modal-head-row">
                <div>
                  <span className="brand-green-subtitle" style={{ fontSize: '0.8rem' }}>PROJECT ENGINEERING SIGN-OFF</span>
                  <h3 style={{ margin: '0.2rem 0 0', color: '#166534' }}> Approve Custom Design: {pmApproveTarget.title}</h3>
                </div>
                <button type="button" onClick={() => { setPmApproveModalOpen(false); setPmApproveTarget(null); }}>×</button>
              </div>

              <form onSubmit={handleSubmitPmApprove} style={{ marginTop: '1.25rem' }}>
                <div style={{ background: '#f0fdf4', padding: '0.9rem 1.1rem', borderRadius: '8px', marginBottom: '1.25rem', border: '1px solid #bbf7d0', fontSize: '0.88rem' }}>
                  <p style={{ margin: '0 0 0.35rem', color: '#166534' }}>
                    <strong>Client:</strong> {pmApproveTarget.client?.name} &nbsp;|&nbsp; <strong>Location:</strong> {pmApproveTarget.location}
                  </p>
                  <p style={{ margin: 0, color: '#166534' }}>
                    <strong>Client Expected Budget:</strong> {pmApproveTarget.expectedBudget ? formatMoney(pmApproveTarget.expectedBudget) : 'N/A'}
                  </p>
                </div>

                <div className="form-grid-2">
                  <div className="form-input-box">
                    <label>PM Approved / Estimated Budget (LKR) *</label>
                    <input
                      type="number"
                      min="0"
                      step="10000"
                      placeholder="e.g. 25000000"
                      value={pmApproveForm.pmEstimatedBudget}
                      onChange={(e) => {
                        const newBud = e.target.value;
                        const dur = pmApproveForm.pmEstimatedDuration;
                        const cName = pmApproveTarget.client?.name || 'Valued Client';
                        const dp = newBud ? (Number(newBud) * 0.2).toLocaleString() : 'N/A';
                        setPmApproveForm({
                          ...pmApproveForm,
                          pmEstimatedBudget: newBud,
                          clientMessage: `Dear ${cName},\n\nWe are pleased to inform you that your custom design project request for "${pmApproveTarget.title}" has been reviewed and officially APPROVED by the Project Manager!\n\n• Estimated Construction Budget: LKR ${newBud ? Number(newBud).toLocaleString() : 'N/A'}\n• Estimated Construction Timeline: ${dur}\n\nPlease proceed to make your initial down payment (approx. 20% = LKR ${dp}) under the Payment section to confirm your project and initiate construction scheduling.`,
                        });
                      }}
                      required
                    />
                  </div>

                  <div className="form-input-box">
                    <label>Estimated Construction Timeline *</label>
                    <input
                      type="text"
                      placeholder="e.g. 6 - 8 Months"
                      value={pmApproveForm.pmEstimatedDuration}
                      onChange={(e) => setPmApproveForm({ ...pmApproveForm, pmEstimatedDuration: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-input-box" style={{ marginTop: '1rem' }}>
                  <label>PM Engineering Assessment Comments (Internal / Team Record)</label>
                  <textarea
                    rows={2}
                    value={pmApproveForm.pmReply}
                    onChange={(e) => setPmApproveForm({ ...pmApproveForm, pmReply: e.target.value })}
                    placeholder="Technical comments, soil notes, permit clearance, etc."
                  />
                </div>

                <div className="form-input-box" style={{ marginTop: '1rem' }}>
                  <label>Official Message &amp; Down Payment Instruction to Client *</label>
                  <textarea
                    rows={6}
                    value={pmApproveForm.clientMessage}
                    onChange={(e) => setPmApproveForm({ ...pmApproveForm, clientMessage: e.target.value })}
                    placeholder="Message sent to client explaining approval and requesting down payment..."
                    required
                  />
                  <small style={{ color: '#047857', display: 'block', marginTop: '4px' }}>
                     This message is immediately delivered to the client's portal and notification inbox with a direct link to make their down payment.
                  </small>
                </div>

                <div className="modal-actions-row" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button type="button" className="btn-outline-green" onClick={() => { setPmApproveModalOpen(false); setPmApproveTarget(null); }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-solid-green" disabled={submittingPmApprove} style={{ background: '#16a34a', borderColor: '#16a34a' }}>
                    {submittingPmApprove ? 'Approving & Notifying...' : ' Confirm Approval & Send Down Payment Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* PM REJECT CUSTOM DESIGN MODAL */}
        {pmRejectModalOpen && pmRejectTarget && (
          <div className="light-modal-overlay">
            <div className="light-modal-box" style={{ maxWidth: '580px' }}>
              <div className="modal-head-row">
                <div>
                  <span className="brand-green-subtitle" style={{ fontSize: '0.8rem', color: '#dc2626' }}>DECLINE SPECIFICATION</span>
                  <h3 style={{ margin: '0.2rem 0 0', color: '#b91c1c' }}> Reject Project Request: {pmRejectTarget.title}</h3>
                </div>
                <button type="button" onClick={() => { setPmRejectModalOpen(false); setPmRejectTarget(null); }}>×</button>
              </div>

              <form onSubmit={handleSubmitPmReject} style={{ marginTop: '1.25rem' }}>
                <div style={{ background: '#fef2f2', padding: '0.85rem 1rem', borderRadius: '8px', marginBottom: '1.25rem', border: '1px solid #fecaca', fontSize: '0.88rem', color: '#991b1b' }}>
                  <p style={{ margin: 0 }}>
                    Rejecting this request will mark it as Not Approved and transmit your explanation directly to the client and Client Manager.
                  </p>
                </div>

                <div className="form-input-box">
                  <label>Rejection Reason &amp; Architectural Feedback *</label>
                  <textarea
                    rows={4}
                    value={pmRejectReason}
                    onChange={(e) => setPmRejectReason(e.target.value)}
                    placeholder="Provide specific reasons (e.g. soil/topography constraints, budget insufficiency, zoning non-compliance)..."
                    required
                  />
                </div>

                <div className="modal-actions-row" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button type="button" className="btn-outline-green" onClick={() => { setPmRejectModalOpen(false); setPmRejectTarget(null); }}>
                    Cancel
                  </button>
                  <button type="submit" className="pm-btn" style={{ background: '#dc2626', color: '#fff', borderColor: '#dc2626' }} disabled={submittingPmReject}>
                    {submittingPmReject ? 'Declining...' : ' Confirm Rejection'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* PM DOWN PAYMENT MESSAGE / REMINDER MODAL */}
        {pmDownPaymentMsgModalOpen && pmDownPaymentMsgTarget && (
          <div className="light-modal-overlay">
            <div className="light-modal-box" style={{ maxWidth: '620px' }}>
              <div className="modal-head-row">
                <div>
                  <span className="brand-green-subtitle" style={{ fontSize: '0.8rem' }}>CLIENT PAYMENT NOTICE</span>
                  <h3 style={{ margin: '0.2rem 0 0' }}>️ Send Down Payment Message to: {pmDownPaymentMsgTarget.client?.name}</h3>
                </div>
                <button type="button" onClick={() => { setPmDownPaymentMsgModalOpen(false); setPmDownPaymentMsgTarget(null); }}>×</button>
              </div>

              <form onSubmit={handleSubmitPmDownPaymentMsg} style={{ marginTop: '1.25rem' }}>
                <div style={{ background: '#eff6ff', padding: '0.85rem 1rem', borderRadius: '8px', marginBottom: '1.25rem', border: '1px solid #bfdbfe', fontSize: '0.88rem', color: '#1e3a8a' }}>
                  <p style={{ margin: '0 0 0.35rem' }}>
                    <strong>Project:</strong> {pmDownPaymentMsgTarget.title} &nbsp;|&nbsp; <strong>Approved Budget:</strong> {pmDownPaymentMsgTarget.pmEstimatedBudget ? formatMoney(pmDownPaymentMsgTarget.pmEstimatedBudget) : (pmDownPaymentMsgTarget.expectedBudget ? formatMoney(pmDownPaymentMsgTarget.expectedBudget) : 'N/A')}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.83rem', color: '#2563eb' }}>
                    Client can complete this payment using Bank Transfer or Online Card Payment directly from their dashboard.
                  </p>
                </div>

                <div className="form-input-box">
                  <label>Message / Down Payment Payment Instructions *</label>
                  <textarea
                    rows={6}
                    value={pmDownPaymentMsg}
                    onChange={(e) => setPmDownPaymentMsg(e.target.value)}
                    placeholder="Enter instructions for the client..."
                    required
                  />
                </div>

                <div className="modal-actions-row" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button type="button" className="btn-outline-green" onClick={() => { setPmDownPaymentMsgModalOpen(false); setPmDownPaymentMsgTarget(null); }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-solid-green" disabled={submittingPmDownPaymentMsg}>
                    {submittingPmDownPaymentMsg ? 'Sending Message...' : '️ Send Message to Client'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* START PROJECT MODAL (ASSIGN CLIENT & INITIALIZE PROJECT) */}
        {startProjectModalOpen && startProjectTarget && (
          <div className="light-modal-overlay">
            <div className="light-modal-box" style={{ maxWidth: '650px' }}>
              <div className="modal-head-row">
                <div>
                  <span className="brand-green-subtitle" style={{ fontSize: '0.8rem' }}>CONSTRUCTION PROJECT INITIALIZATION</span>
                  <h3 style={{ margin: '0.2rem 0 0', color: '#166534' }}>Start Project: {startProjectTarget.title}</h3>
                </div>
                <button type="button" onClick={() => { setStartProjectModalOpen(false); setStartProjectTarget(null); }}>×</button>
              </div>

              <form onSubmit={handleConfirmStartProject} style={{ marginTop: '1.25rem' }}>
                <div style={{ background: '#f0fdf4', padding: '0.85rem 1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #bbf7d0', fontSize: '0.88rem' }}>
                  <p style={{ margin: '0 0 0.35rem' }}>
                    <strong>Assigned Client:</strong> {startProjectTarget.client?.name} ({startProjectTarget.client?.email || 'N/A'}, {startProjectTarget.client?.phone || 'N/A'})
                  </p>
                  <p style={{ margin: 0, color: '#166534' }}>
                    Starting this project will assign client <strong>{startProjectTarget.client?.name}</strong> to the construction pipeline. The client will be able to track live progress and milestones from their portal.
                  </p>
                </div>

                <div className="form-grid-2">
                  <div className="form-input-box">
                    <label>Project Name *</label>
                    <input
                      type="text"
                      value={startProjectForm.name}
                      onChange={(e) => setStartProjectForm({ ...startProjectForm, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-input-box">
                    <label>Property Category *</label>
                    <select
                      value={startProjectForm.category}
                      onChange={(e) => setStartProjectForm({ ...startProjectForm, category: e.target.value })}
                      required
                    >
                      <option value="">-- Select Property Category --</option>
                      <option value="RESIDENCIES">Residencies</option>
                      <option value="LANDS">Lands &amp; Plots</option>
                      <option value="APARTMENTS">Apartments</option>
                    </select>
                  </div>
                </div>

                <div className="form-grid-2" style={{ marginTop: '0.75rem' }}>
                  <div className="form-input-box">
                    <label>Site Location</label>
                    <input
                      type="text"
                      value={startProjectForm.location}
                      onChange={(e) => setStartProjectForm({ ...startProjectForm, location: e.target.value })}
                      placeholder="e.g. Negombo, Colombo 07"
                    />
                  </div>

                  <div className="form-input-box">
                    <label>Agreed Project Budget (LKR) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={startProjectForm.budget}
                      onChange={(e) => setStartProjectForm({ ...startProjectForm, budget: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-grid-2" style={{ marginTop: '0.75rem' }}>
                  <div className="form-input-box">
                    <label>Project Start Date *</label>
                    <input
                      type="date"
                      min={getTodayDateString()}
                      value={startProjectForm.startDate}
                      onChange={(e) => setStartProjectForm({ ...startProjectForm, startDate: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-input-box">
                    <label>Estimated Completion Date</label>
                    <input
                      type="date"
                      min={startProjectForm.startDate || getTodayDateString()}
                      value={startProjectForm.endDate}
                      onChange={(e) => setStartProjectForm({ ...startProjectForm, endDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-input-box" style={{ marginTop: '0.75rem' }}>
                  <label>Project Description &amp; Scope of Work</label>
                  <textarea
                    rows={3}
                    value={startProjectForm.description}
                    onChange={(e) => setStartProjectForm({ ...startProjectForm, description: e.target.value })}
                    placeholder="Enter project scope and specifications..."
                  />
                </div>

                {startProjectModalError && (
                  <div className="pm-alert error" style={{ marginTop: '1rem', marginBottom: 0 }}>
                    {startProjectModalError}
                  </div>
                )}

                <div className="modal-actions-row" style={{ marginTop: '1.5rem' }}>
                  <button type="button" className="btn-outline-green" onClick={() => { setStartProjectModalOpen(false); setStartProjectTarget(null); setStartProjectModalError(''); }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-solid-green" disabled={startingProject} style={{ background: '#16a34a' }}>
                    {startingProject ? 'Starting Project & Initializing...' : 'Initialize Project & Assign Client'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* PM INQUIRY TECHNICAL DECISION MODAL */}
        {inquiryDecisionModalOpen && inquiryDecisionTarget && (
          <div className="light-modal-overlay" style={{ zIndex: 10000, padding: '1rem' }}>
            <div className="light-modal-box" style={{ maxWidth: '640px', width: '95%', padding: '1.75rem', borderRadius: '14px' }}>
              <div className="modal-head-row">
                <div>
                  <span className="brand-green-subtitle" style={{ fontSize: '0.8rem' }}>ENGINEERING FEASIBILITY &amp; TECHNICAL DECISION</span>
                  <h3 style={{ margin: '0.2rem 0 0', color: inquiryDecisionForm.decision === 'APPROVED' ? '#166534' : '#dc2626' }}>
                    {inquiryDecisionForm.decision === 'APPROVED' ? 'Approve Technical Feasibility' : 'Reject Inquiry Assessment'}
                  </h3>
                </div>
                <button type="button" onClick={() => { setInquiryDecisionModalOpen(false); setInquiryDecisionTarget(null); }}>×</button>
              </div>

              <form onSubmit={handleSubmitInquiryDecision} style={{ marginTop: '1.25rem' }}>
                <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #e2e8f0', fontSize: '0.88rem' }}>
                  <p style={{ margin: '0 0 0.35rem' }}>
                    <strong>Client:</strong> {inquiryDecisionTarget.client?.name} ({inquiryDecisionTarget.client?.email || 'N/A'}{inquiryDecisionTarget.client?.phone ? `, ${inquiryDecisionTarget.client.phone}` : ''})
                  </p>
                  <p style={{ margin: 0 }}>
                    <strong>Subject:</strong> {inquiryDecisionTarget.subject}
                    {inquiryDecisionTarget.project && <span> &bull; Project: <b>{inquiryDecisionTarget.project.name}</b></span>}
                    {inquiryDecisionTarget.design && <span> &bull; Design Model: <b>{inquiryDecisionTarget.design.name}</b></span>}
                  </p>
                </div>

                <div className="form-input-box">
                  <label style={{ fontWeight: 700, marginBottom: '6px', display: 'block' }}>Official Decision *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '4px' }}>
                    <div
                      onClick={() => {
                        const newRemarks = (!inquiryDecisionForm.decisionRemarks || inquiryDecisionForm.decisionRemarks.includes('Site parameters or design constraints'))
                          ? 'Structural & engineering feasibility verified. Specifications, site requirements, and architectural scope meet Odiliya standards.'
                          : inquiryDecisionForm.decisionRemarks;
                        setInquiryDecisionForm({
                          ...inquiryDecisionForm,
                          decision: 'APPROVED',
                          decisionRemarks: newRemarks,
                        });
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '0.88rem',
                        border: inquiryDecisionForm.decision === 'APPROVED' ? '2px solid #16a34a' : '1.5px solid #cbd5e1',
                        background: inquiryDecisionForm.decision === 'APPROVED' ? '#ecfdf5' : '#ffffff',
                        color: inquiryDecisionForm.decision === 'APPROVED' ? '#15803d' : '#334155',
                        boxShadow: inquiryDecisionForm.decision === 'APPROVED' ? '0 2px 6px rgba(22,163,74,0.15)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <input
                        type="radio"
                        name="pmDecisionChoice"
                        value="APPROVED"
                        checked={inquiryDecisionForm.decision === 'APPROVED'}
                        onChange={() => {
                          const newRemarks = (!inquiryDecisionForm.decisionRemarks || inquiryDecisionForm.decisionRemarks.includes('Site parameters or design constraints'))
                            ? 'Structural & engineering feasibility verified. Specifications, site requirements, and architectural scope meet Odiliya standards.'
                            : inquiryDecisionForm.decisionRemarks;
                          setInquiryDecisionForm({
                            ...inquiryDecisionForm,
                            decision: 'APPROVED',
                            decisionRemarks: newRemarks,
                          });
                        }}
                        style={{ accentColor: '#16a34a', width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <span> APPROVE (Feasible &amp; Ready for Contract)</span>
                    </div>

                    <div
                      onClick={() => {
                        const newRemarks = (!inquiryDecisionForm.decisionRemarks || inquiryDecisionForm.decisionRemarks.includes('Structural & engineering feasibility'))
                          ? 'Site parameters or design constraints currently incompatible with engineering requirements.'
                          : inquiryDecisionForm.decisionRemarks;
                        setInquiryDecisionForm({
                          ...inquiryDecisionForm,
                          decision: 'REJECTED',
                          decisionRemarks: newRemarks,
                        });
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '0.88rem',
                        border: inquiryDecisionForm.decision === 'REJECTED' ? '2px solid #dc2626' : '1.5px solid #cbd5e1',
                        background: inquiryDecisionForm.decision === 'REJECTED' ? '#fef2f2' : '#ffffff',
                        color: inquiryDecisionForm.decision === 'REJECTED' ? '#b91c1c' : '#334155',
                        boxShadow: inquiryDecisionForm.decision === 'REJECTED' ? '0 2px 6px rgba(220,38,38,0.15)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <input
                        type="radio"
                        name="pmDecisionChoice"
                        value="REJECTED"
                        checked={inquiryDecisionForm.decision === 'REJECTED'}
                        onChange={() => {
                          const newRemarks = (!inquiryDecisionForm.decisionRemarks || inquiryDecisionForm.decisionRemarks.includes('Structural & engineering feasibility'))
                            ? 'Site parameters or design constraints currently incompatible with engineering requirements.'
                            : inquiryDecisionForm.decisionRemarks;
                          setInquiryDecisionForm({
                            ...inquiryDecisionForm,
                            decision: 'REJECTED',
                            decisionRemarks: newRemarks,
                          });
                        }}
                        style={{ accentColor: '#dc2626', width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <span> REJECT (Not Feasible / Incompatible)</span>
                    </div>
                  </div>
                </div>

                <div className="form-input-box" style={{ marginTop: '0.85rem' }}>
                  <label>Engineering Evaluation &amp; Decision Remarks *</label>
                  <textarea
                    rows={4}
                    value={inquiryDecisionForm.decisionRemarks}
                    onChange={(e) => setInquiryDecisionForm({ ...inquiryDecisionForm, decisionRemarks: e.target.value })}
                    placeholder="Detail the technical reasoning, structural suitability, soil compatibility, site clearance comments, or rejection rationale..."
                    required
                  />
                </div>

                {inquiryDecisionForm.decision === 'APPROVED' && (
                  <div className="form-grid-2" style={{ marginTop: '0.85rem' }}>
                    <div className="form-input-box">
                      <label>Estimated Construction Budget (LKR)</label>
                      <input
                        type="number"
                        min="0"
                        step="10000"
                        placeholder="e.g. 25000000"
                        value={inquiryDecisionForm.estimatedBudget}
                        onChange={(e) => setInquiryDecisionForm({ ...inquiryDecisionForm, estimatedBudget: e.target.value })}
                      />
                    </div>

                    <div className="form-input-box">
                      <label>Estimated Construction Duration</label>
                      <input
                        type="text"
                        placeholder="e.g. 8 - 10 Months"
                        value={inquiryDecisionForm.estimatedDuration}
                        onChange={(e) => setInquiryDecisionForm({ ...inquiryDecisionForm, estimatedDuration: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                <div style={{ marginTop: '0.85rem', padding: '0.75rem', background: inquiryDecisionForm.decision === 'APPROVED' ? '#ecfdf5' : '#fef2f2', borderRadius: '8px', border: `1px solid ${inquiryDecisionForm.decision === 'APPROVED' ? '#a7f3d0' : '#fecaca'}`, fontSize: '0.82rem', color: inquiryDecisionForm.decision === 'APPROVED' ? '#065f46' : '#991b1b' }}>
                  {inquiryDecisionForm.decision === 'APPROVED'
                    ? ' Upon approval, this decision is automatically transmitted to the Client Manager so they can draft and sign the formal construction contract agreement with the client.'
                    : ' Upon rejection, the client and Client Manager will receive an official notification with your technical rationale.'}
                </div>

                <div className="modal-actions-row" style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" className="btn-outline-green" onClick={() => { setInquiryDecisionModalOpen(false); setInquiryDecisionTarget(null); }}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-solid-green"
                    disabled={submittingInquiryDecision}
                    style={{
                      background: inquiryDecisionForm.decision === 'APPROVED' ? '#16a34a' : '#dc2626',
                      borderColor: inquiryDecisionForm.decision === 'APPROVED' ? '#16a34a' : '#dc2626',
                      padding: '8px 20px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                    onClick={handleSubmitInquiryDecision}
                  >
                    {submittingInquiryDecision ? 'Submitting Decision...' : `Submit Official Decision: [${inquiryDecisionForm.decision}]`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* COMPOSE DIRECT INQUIRY TO CLIENT MODAL */}
        {composeInquiryOpen && (
          <div className="light-modal-overlay" style={{ zIndex: 10000, padding: '1rem' }}>
            <div className="light-modal-box" style={{ maxWidth: '620px', width: '95%', padding: '1.75rem', borderRadius: '14px' }}>
              <div className="modal-head-row">
                <div>
                  <span className="brand-green-subtitle" style={{ fontSize: '0.8rem' }}>DIRECT CLIENT COMMUNICATION</span>
                  <h3 style={{ margin: '0.2rem 0 0', color: '#0f172a' }}>Send Inquiry to Client</h3>
                </div>
                <button type="button" onClick={() => setComposeInquiryOpen(false)}>×</button>
              </div>

              <form onSubmit={handleSendComposeInquiry} style={{ marginTop: '1.25rem' }}>
                <div className="form-grid-2">
                  <div className="form-input-box">
                    <label>Client *</label>
                    <select
                      value={composeInquiryForm.clientId}
                      onChange={(e) => setComposeInquiryForm({ ...composeInquiryForm, clientId: e.target.value })}
                      required
                    >
                      <option value="">-- Select Client --</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-input-box">
                    <label>Related Project (Optional)</label>
                    <select
                      value={composeInquiryForm.projectId}
                      onChange={(e) => setComposeInquiryForm({ ...composeInquiryForm, projectId: e.target.value })}
                    >
                      <option value="">-- Choose Project (Optional) --</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-input-box" style={{ marginTop: '1rem' }}>
                  <label>Subject *</label>
                  <input
                    type="text"
                    placeholder="e.g. Milestone Inspection & Material Confirmation"
                    value={composeInquiryForm.subject}
                    onChange={(e) => setComposeInquiryForm({ ...composeInquiryForm, subject: e.target.value })}
                    required
                  />
                </div>

                <div className="form-input-box" style={{ marginTop: '1rem' }}>
                  <label>Message *</label>
                  <textarea
                    rows={5}
                    placeholder="Write your inquiry or engineering update directly to the client..."
                    value={composeInquiryForm.message}
                    onChange={(e) => setComposeInquiryForm({ ...composeInquiryForm, message: e.target.value })}
                    required
                  />
                </div>

                <small style={{ display: 'block', color: 'var(--text-muted)', marginTop: '0.6rem', fontSize: '0.8rem' }}>
                  The client will receive this message directly in their Client Portal and can reply back to you in this thread.
                </small>

                <div className="modal-actions-row" style={{ marginTop: '1.5rem' }}>
                  <button type="button" className="btn-outline-green" onClick={() => setComposeInquiryOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-solid-green" disabled={sendingComposeInquiry}>
                    {sendingComposeInquiry ? 'Sending...' : 'Send Inquiry to Client'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="pm-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function FormCard({ title, children }) {
  return (
    <section className="pm-card">
      <div className="pm-card-heading">
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function EmptyState({ message }) {
  return <p className="pm-empty">{message}</p>;
}

function TaskTable({ tasks, completeTask }) {
  return !tasks.length ? (
    <EmptyState message="No tasks have been assigned yet." />
  ) : (
    <div className="pm-table-wrap">
      <table className="pm-table">
        <thead>
          <tr>
            <th>Task</th>
            <th>Assignee</th>
            <th>Deadline</th>
            <th>Progress</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id}>
              <td>
                <strong>{task.taskName}</strong>
                {task.description && <small>{task.description}</small>}
                {task.progressRemarks && (
                  <div style={{ fontSize: '0.75rem', color: '#047857', marginTop: '4px', fontStyle: 'italic' }}>
                    Worker Note: {task.progressRemarks}
                  </div>
                )}
              </td>
              <td>{task.assignedEmployee?.name || 'Unassigned'}</td>
              <td>{formatDate(task.deadline)}</td>
              <td style={{ minWidth: '130px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>
                  <span>{task.progressPercentage || 0}%</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${task.progressPercentage || 0}%`,
                      height: '100%',
                      background: (task.progressPercentage || 0) === 100 ? '#10b981' : '#3b82f6',
                      borderRadius: '3px',
                    }}
                  />
                </div>
              </td>
              <td>
                <Status value={task.status} />
              </td>
              <td>
                {task.status !== 'COMPLETED' && (
                  <button className="pm-text-button" onClick={() => completeTask(task)}>
                    Complete
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProjectTable({ projects, spentByProject, onEdit, onDownloadPdf, emptyMessage }) {
  return !projects.length ? (
    <EmptyState message={emptyMessage} />
  ) : (
    <div className="pm-table-wrap">
      <table className="pm-table">
        <thead>
          <tr>
            <th>Project</th>
            <th>Client</th>
            <th>Dates</th>
            <th>Budget / Spent</th>
            <th>Progress</th>
            <th>Status</th>
            <th style={{ textAlign: 'center' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr key={project.id}>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {project.imageUrl && (
                    <img
                      src={project.imageUrl}
                      alt={project.name}
                      style={{ width: '38px', height: '38px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #cbd5e1', flexShrink: 0 }}
                    />
                  )}
                  <div>
                    <strong>{project.name}</strong>
                    <small>{project.location || project.category || 'Odiliya Project'}</small>
                  </div>
                </div>
              </td>
              <td>{project.client?.name || <span style={{ color: '#9ca3af' }}>Unassigned</span>}</td>
              <td>
                {formatDate(project.startDate)}
                <br />
                {formatDate(project.endDate)}
              </td>
              <td>
                {formatMoney(project.budget)}
                <small>{formatMoney(spentByProject[project.id] || 0)} spent</small>
              </td>
              <td>
                <strong>{project.progressPercentage || 0}%</strong>
              </td>
              <td>
                <Status value={project.status} />
              </td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                  <button
                    type="button"
                    className="pm-text-button"
                    onClick={() => onEdit(project)}
                    title="Edit project parameters"
                  >
                    Edit
                  </button>
                  {onDownloadPdf && (
                    <button
                      type="button"
                      onClick={() => onDownloadPdf(project)}
                      style={{
                        padding: '4px 10px',
                        background: '#ecfdf5',
                        color: '#047857',
                        border: '1px solid #a7f3d0',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                      title="Download executive project report (PDF with images)"
                    >
                      <span></span> PDF
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
