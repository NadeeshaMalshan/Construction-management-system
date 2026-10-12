package com.construction.service;

import com.construction.enums.ProjectStatus;
import com.construction.enums.PropertyCategory;
import com.construction.exception.BadRequestException;
import com.construction.exception.ResourceNotFoundException;
import com.construction.model.Client;
import com.construction.model.ClientNotification;
import com.construction.model.Project;
import com.construction.model.ProjectRequest;
import com.construction.repository.ClientNotificationRepository;
import com.construction.repository.ClientRepository;
import com.construction.repository.DesignRepository;
import com.construction.repository.ProjectRepository;
import com.construction.repository.ProjectRequestRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class ProjectRequestService {

    private final ProjectRequestRepository projectRequestRepository;
    private final ClientRepository clientRepository;
    private final ProjectRepository projectRepository;
    private final ClientNotificationRepository notificationRepository;
    private final DesignRepository designRepository;

    public ProjectRequestService(ProjectRequestRepository projectRequestRepository,
                                 ClientRepository clientRepository,
                                 ProjectRepository projectRepository,
                                 ClientNotificationRepository notificationRepository,
                                 DesignRepository designRepository) {
        this.projectRequestRepository = projectRequestRepository;
        this.clientRepository = clientRepository;
        this.projectRepository = projectRepository;
        this.notificationRepository = notificationRepository;
        this.designRepository = designRepository;
    }

    public ProjectRequest create(ProjectRequest request) {
        if (request.getClient() != null) {
            if (request.getClient().getId() != null) {
                Client client = clientRepository.findById(request.getClient().getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Client not found"));
                request.setClient(client);
            } else if (request.getClient().getEmail() != null && !request.getClient().getEmail().trim().isEmpty()) {
                String email = request.getClient().getEmail().trim();
                Client client = clientRepository.findByEmailIgnoreCase(email).orElseGet(() -> {
                    Client newClient = new Client();
                    String clientName = request.getClient().getName() != null && !request.getClient().getName().trim().isEmpty()
                            ? request.getClient().getName().trim()
                            : "Valued Client";
                    newClient.setName(clientName);
                    newClient.setEmail(email);
                    newClient.setPhone(request.getClient().getPhone());
                    newClient.setStatus("ACTIVE");
                    newClient.setPreferredCategory(request.getCategory() != null ? request.getCategory().name() : "RESIDENCIES");
                    return clientRepository.save(newClient);
                });
                request.setClient(client);
            }
        }
        if (request.getClient() == null || request.getClient().getId() == null) {
            throw new BadRequestException("Client information is required to submit a project request.");
        }

        if (request.getSelectedDesign() != null && request.getSelectedDesign().getId() != null) {
            request.setSelectedDesign(designRepository.findById(request.getSelectedDesign().getId()).orElse(null));
        } else {
            request.setSelectedDesign(null);
        }

        if (request.getImageUrls() != null && request.getImageUrls().size() > 5) {
            throw new BadRequestException("Maximum 5 photos/documents allowed per project request.");
        }

        boolean isCustom = Boolean.TRUE.equals(request.getIsCustomDesign()) || request.getSelectedDesign() == null;
        request.setIsCustomDesign(isCustom);
        // All client project requests route directly to Project Manager for feasibility and technical review
        request.setStatus("PENDING_PM_REVIEW");
        request.setCreatedAt(LocalDateTime.now());
        request.setUpdatedAt(LocalDateTime.now());

        ProjectRequest saved = projectRequestRepository.save(request);

        if (saved.getClient() != null) {
            String notifTitle = isCustom
                    ? "Custom Design Request Received: " + saved.getTitle()
                    : "Project Request Received: " + saved.getTitle();
            String notifMsg = isCustom
                    ? "Your custom design request has been received and routed directly to our Project Manager for engineering review."
                    : "Your project request has been received and routed directly to our Project Manager for technical feasibility review.";
            notificationRepository.save(new ClientNotification(
                    saved.getClient(),
                    notifTitle,
                    notifMsg,
                    "PROJECT_REQUEST_UPDATE",
                    "#request-project"
            ));
        }

        return saved;
    }

    public List<ProjectRequest> findAll() {
        return projectRequestRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<ProjectRequest> findByClientId(Long clientId) {
        return projectRequestRepository.findByClientIdOrderByCreatedAtDesc(clientId);
    }

    public List<ProjectRequest> findForwardedToPm() {
        return projectRequestRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<ProjectRequest> findCustomRequests() {
        return projectRequestRepository.findByIsCustomDesignTrueOrderByCreatedAtDesc();
    }

    public ProjectRequest findById(Long id) {
        return projectRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project request not found with id " + id));
    }

    public ProjectRequest forwardToPm(Long id, String cmNotes, String forwardedByCm) {
        ProjectRequest request = findById(id);
        request.setCmNotes(cmNotes);
        request.setForwardedByCm(forwardedByCm != null && !forwardedByCm.trim().isEmpty() ? forwardedByCm.trim() : "Client Manager");
        request.setForwardedToPmAt(LocalDateTime.now());
        request.setStatus("FORWARDED_TO_PM");
        request.setUpdatedAt(LocalDateTime.now());
        return projectRequestRepository.save(request);
    }

    public ProjectRequest pmReply(Long id, String pmReply, BigDecimal pmEstimatedBudget, String pmEstimatedDuration, String pmRespondedBy) {
        ProjectRequest request = findById(id);
        request.setPmReply(pmReply);
        request.setPmEstimatedBudget(pmEstimatedBudget);
        request.setPmEstimatedDuration(pmEstimatedDuration);
        request.setPmRespondedBy(pmRespondedBy != null && !pmRespondedBy.trim().isEmpty() ? pmRespondedBy.trim() : "Project Manager");
        request.setPmRespondedAt(LocalDateTime.now());
        request.setStatus("PM_REVIEWED");
        request.setUpdatedAt(LocalDateTime.now());
        return projectRequestRepository.save(request);
    }

    public ProjectRequest sendResponseToClient(Long id, String clientMessage, String clientNotifiedBy) {
        ProjectRequest request = findById(id);
        request.setClientMessage(clientMessage);
        request.setClientNotifiedBy(clientNotifiedBy != null && !clientNotifiedBy.trim().isEmpty() ? clientNotifiedBy.trim() : "Project Manager");
        request.setClientNotifiedAt(LocalDateTime.now());
        if (!"APPROVED".equals(request.getStatus()) && !"PROJECT_STARTED".equals(request.getStatus())) {
            request.setStatus("CLIENT_NOTIFIED");
        }
        request.setUpdatedAt(LocalDateTime.now());

        ProjectRequest saved = projectRequestRepository.save(request);

        // Notify client
        if (saved.getClient() != null) {
            String title = "APPROVED".equals(saved.getStatus())
                    ? "Down Payment Notice: " + saved.getTitle()
                    : "Project Proposal Ready: " + saved.getTitle();
            String link = "APPROVED".equals(saved.getStatus())
                    ? "#downpayments"
                    : "#request-project";
            notificationRepository.save(new ClientNotification(
                    saved.getClient(),
                    title,
                    clientMessage != null && !clientMessage.trim().isEmpty()
                            ? clientMessage.trim()
                            : "Update received regarding your project request.",
                    "PROJECT_REQUEST_UPDATE",
                    link
            ));
        }

        return saved;
    }

    public ProjectRequest approve(Long id, String cmNotes, String clientMessage, String approvedBy) {
        return approve(id, cmNotes, clientMessage, approvedBy, null, null, null);
    }

    public ProjectRequest approve(Long id, String cmNotes, String clientMessage, String approvedBy,
                                  BigDecimal pmEstimatedBudget, String pmEstimatedDuration, String pmReply) {
        ProjectRequest request = findById(id);
        if (cmNotes != null && !cmNotes.trim().isEmpty()) {
            request.setCmNotes(cmNotes.trim());
        }
        if (pmEstimatedBudget != null && pmEstimatedBudget.compareTo(BigDecimal.ZERO) > 0) {
            request.setPmEstimatedBudget(pmEstimatedBudget);
        }
        if (pmEstimatedDuration != null && !pmEstimatedDuration.trim().isEmpty()) {
            request.setPmEstimatedDuration(pmEstimatedDuration.trim());
        }
        if (pmReply != null && !pmReply.trim().isEmpty()) {
            request.setPmReply(pmReply.trim());
            request.setPmRespondedAt(LocalDateTime.now());
            request.setPmRespondedBy(approvedBy != null && !approvedBy.trim().isEmpty() ? approvedBy.trim() : "Project Manager");
        }
        request.setStatus("APPROVED");
        String approver = approvedBy != null && !approvedBy.trim().isEmpty() ? approvedBy.trim() : "Project Manager";
        request.setApprovedBy(approver);
        request.setApprovedAt(LocalDateTime.now());

        String defaultDownPaymentMsg = "Congratulations! Your custom design project '" + request.getTitle() + "' has been approved by the Project Manager." +
                (request.getPmEstimatedBudget() != null ? " Estimated Budget: LKR " + request.getPmEstimatedBudget().toPlainString() + "." : "") +
                (request.getPmEstimatedDuration() != null ? " Estimated Duration: " + request.getPmEstimatedDuration() + "." : "") +
                " Please proceed to make your initial down payment to confirm and initiate your construction project.";

        String finalClientMsg = (clientMessage != null && !clientMessage.trim().isEmpty())
                ? clientMessage.trim()
                : defaultDownPaymentMsg;

        request.setClientMessage(finalClientMsg);
        request.setClientNotifiedAt(LocalDateTime.now());
        request.setClientNotifiedBy(approver);
        request.setUpdatedAt(LocalDateTime.now());
        ProjectRequest saved = projectRequestRepository.save(request);

        if (saved.getClient() != null) {
            notificationRepository.save(new ClientNotification(
                    saved.getClient(),
                    "Project Approved - Down Payment Required: " + saved.getTitle(),
                    finalClientMsg,
                    "PROJECT_REQUEST_UPDATE",
                    "#downpayments"
            ));
        }
        return saved;
    }

    public ProjectRequest reject(Long id, String reason, String rejectedBy) {
        ProjectRequest request = findById(id);
        request.setStatus("REJECTED");
        request.setRejectionReason(reason);
        request.setRejectedBy(rejectedBy != null && !rejectedBy.trim().isEmpty() ? rejectedBy.trim() : "Project Manager");
        request.setRejectedAt(LocalDateTime.now());
        request.setUpdatedAt(LocalDateTime.now());
        ProjectRequest saved = projectRequestRepository.save(request);

        if (saved.getClient() != null) {
            String msg = "Your custom design project request for '" + saved.getTitle() + "' was not approved. " +
                    (reason != null && !reason.trim().isEmpty() ? "Reason: " + reason.trim() : "");
            notificationRepository.save(new ClientNotification(
                    saved.getClient(),
                    "Project Request Status: " + saved.getTitle(),
                    msg,
                    "PROJECT_REQUEST_UPDATE",
                    "#request-project"
            ));
        }
        return saved;
    }

    public Project startProject(Long id, Project projectData, String startedBy) {
        ProjectRequest request = findById(id);
        if (request.getClient() == null) {
            throw new BadRequestException("Request does not have an associated client.");
        }

        Project project = new Project();
        String projName = (projectData != null && projectData.getName() != null && !projectData.getName().trim().isEmpty())
                ? projectData.getName().trim()
                : request.getTitle();
        project.setName(projName);

        String projDesc = (projectData != null && projectData.getDescription() != null && !projectData.getDescription().trim().isEmpty())
                ? projectData.getDescription().trim()
                : request.getDescription();
        project.setDescription(projDesc);

        PropertyCategory category = (projectData != null && projectData.getCategory() != null)
                ? projectData.getCategory()
                : (request.getCategory() != null ? request.getCategory() : PropertyCategory.RESIDENCIES);
        project.setCategory(category);

        String projLoc = (projectData != null && projectData.getLocation() != null && !projectData.getLocation().trim().isEmpty())
                ? projectData.getLocation().trim()
                : request.getLocation();
        project.setLocation(projLoc);

        BigDecimal budget = projectData != null ? projectData.getBudget() : null;
        if (budget == null || budget.compareTo(BigDecimal.ZERO) <= 0) {
            budget = request.getPmEstimatedBudget() != null ? request.getPmEstimatedBudget() : request.getExpectedBudget();
        }
        if (budget == null || budget.compareTo(BigDecimal.ZERO) <= 0) {
            budget = new BigDecimal("1000000.00");
        }
        project.setBudget(budget);

        LocalDate startDate = (projectData != null && projectData.getStartDate() != null)
                ? projectData.getStartDate()
                : (request.getTargetStartDate() != null ? request.getTargetStartDate() : LocalDate.now());
        project.setStartDate(startDate);

        if (projectData != null && projectData.getEndDate() != null) {
            project.setEndDate(projectData.getEndDate());
        }

        project.setStatus(projectData != null && projectData.getStatus() != null ? projectData.getStatus() : ProjectStatus.IN_PROGRESS);
        project.setProgressPercentage(0);
        project.setMarketingDesign(false);
        project.setAddedBy("PROJECT_MANAGER");
        project.setClient(request.getClient());
        project.setSpecifications(request.getSpecifications());

        if (projectData != null && projectData.getImageUrls() != null && !projectData.getImageUrls().isEmpty()) {
            project.setImageUrls(new ArrayList<>(projectData.getImageUrls()));
            project.setImageUrl(projectData.getImageUrls().get(0));
        } else if (request.getImageUrls() != null && !request.getImageUrls().isEmpty()) {
            project.setImageUrls(new ArrayList<>(request.getImageUrls()));
            project.setImageUrl(request.getImageUrls().get(0));
        }

        Project savedProject = projectRepository.save(project);

        // Update request status
        request.setStatus("PROJECT_STARTED");
        request.setStartedProjectId(savedProject.getId());
        request.setUpdatedAt(LocalDateTime.now());
        projectRequestRepository.save(request);

        // Notify client
        notificationRepository.save(new ClientNotification(
                request.getClient(),
                "Project Started: " + savedProject.getName(),
                "Your project has been officially started and assigned to you by the Project Manager! You can track its progress in My Projects.",
                "PROJECT_UPDATE",
                "#my-projects"
        ));

        return savedProject;
    }

    public ProjectRequest markDownPaymentPaid(Long id, BigDecimal amount, String refNumber) {
        ProjectRequest request = findById(id);
        request.setDownPaymentPaid(true);
        if (amount != null) {
            request.setDownPaymentAmount(amount);
        }
        if (refNumber != null && !refNumber.isBlank()) {
            request.setDownPaymentRef(refNumber.trim());
        }
        request.setDownPaymentDate(LocalDateTime.now());
        request.setUpdatedAt(LocalDateTime.now());
        ProjectRequest saved = projectRequestRepository.save(request);

        if (saved.getClient() != null) {
            notificationRepository.save(new ClientNotification(
                    saved.getClient(),
                    "Down Payment Verified for " + saved.getTitle(),
                    "Your initial down payment" + (amount != null ? " of LKR " + amount.toPlainString() : "") + " has been received! Project management is scheduling site mobilization.",
                    "PAYMENT",
                    "#request-project"
            ));
        }

        return saved;
    }

    public void delete(Long id) {
        projectRequestRepository.deleteById(id);
    }
}
