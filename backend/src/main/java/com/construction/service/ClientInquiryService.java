package com.construction.service;

import com.construction.exception.BadRequestException;
import com.construction.exception.ResourceNotFoundException;
import com.construction.model.Client;
import com.construction.model.ClientInquiry;
import com.construction.model.ClientNotification;
import com.construction.model.Contract;
import com.construction.model.InquiryMessage;
import com.construction.model.Project;
import com.construction.repository.ClientInquiryRepository;
import com.construction.repository.ClientNotificationRepository;
import com.construction.repository.ClientRepository;
import com.construction.repository.ContractRepository;
import com.construction.repository.DesignRepository;
import com.construction.repository.ProjectRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class ClientInquiryService {

    public static final String ROLE_CLIENT = "CLIENT";
    public static final String ROLE_PROJECT_MANAGER = "PROJECT_MANAGER";
    public static final String ROLE_CLIENT_MANAGER = "CLIENT_MANAGER";

    private final ClientInquiryRepository inquiryRepository;
    private final ClientRepository clientRepository;
    private final ClientNotificationRepository notificationRepository;
    private final ProjectRepository projectRepository;
    private final DesignRepository designRepository;
    private final ContractRepository contractRepository;

    public ClientInquiryService(ClientInquiryRepository inquiryRepository,
                                ClientRepository clientRepository,
                                ClientNotificationRepository notificationRepository,
                                ProjectRepository projectRepository,
                                DesignRepository designRepository,
                                ContractRepository contractRepository) {
        this.inquiryRepository = inquiryRepository;
        this.clientRepository = clientRepository;
        this.notificationRepository = notificationRepository;
        this.projectRepository = projectRepository;
        this.designRepository = designRepository;
        this.contractRepository = contractRepository;
    }

    public ClientInquiry create(ClientInquiry inquiry) {
        if (inquiry.getClient() != null) {
            if (inquiry.getClient().getId() != null) {
                Client client = clientRepository.findById(inquiry.getClient().getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Client not found"));
                inquiry.setClient(client);
            } else if (inquiry.getClient().getEmail() != null && !inquiry.getClient().getEmail().trim().isEmpty()) {
                String email = inquiry.getClient().getEmail().trim();
                Client client = clientRepository.findByEmailIgnoreCase(email).orElseGet(() -> {
                    Client newClient = new Client();
                    String clientName = inquiry.getClient().getName() != null && !inquiry.getClient().getName().trim().isEmpty()
                            ? inquiry.getClient().getName().trim()
                            : "Website Inquirer";
                    newClient.setName(clientName);
                    newClient.setEmail(email);
                    newClient.setPhone(inquiry.getClient().getPhone());
                    newClient.setStatus("ACTIVE");
                    newClient.setPreferredCategory("RESIDENCIES");
                    return clientRepository.save(newClient);
                });
                inquiry.setClient(client);
            }
        }
        if (inquiry.getProject() != null && inquiry.getProject().getId() != null) {
            inquiry.setProject(projectRepository.findById(inquiry.getProject().getId()).orElse(null));
        } else {
            inquiry.setProject(null);
        }
        if (inquiry.getDesign() != null && inquiry.getDesign().getId() != null) {
            inquiry.setDesign(designRepository.findById(inquiry.getDesign().getId()).orElse(null));
        } else {
            inquiry.setDesign(null);
        }

        boolean fromManager = ROLE_PROJECT_MANAGER.equalsIgnoreCase(inquiry.getInitiatedBy()) 
                || ROLE_CLIENT_MANAGER.equalsIgnoreCase(inquiry.getInitiatedBy());
        inquiry.setInitiatedBy(fromManager ? ROLE_PROJECT_MANAGER : ROLE_CLIENT);
        inquiry.setCreatedAt(LocalDateTime.now());
        // PENDING = waiting on the Project Manager, ANSWERED = waiting on the client
        inquiry.setStatus(fromManager ? "ANSWERED" : "PENDING");

        ClientInquiry saved = inquiryRepository.save(inquiry);

        if (fromManager && saved.getClient() != null) {
            notificationRepository.save(new ClientNotification(
                    saved.getClient(),
                    "New message from Project Manager: " + saved.getSubject(),
                    "The project management team has sent you an inquiry. Open Inquiries in your portal to reply.",
                    "INQUIRY_REPLY",
                    "#client-support"
            ));
        }
        return saved;
    }

    /**
     * Appends a message to an inquiry conversation thread.
     */
    public ClientInquiry addMessage(Long id, String senderRole, String senderName, String text) {
        if (text == null || text.trim().isEmpty()) {
            throw new BadRequestException("Message is required");
        }
        ClientInquiry inquiry = findById(id);
        boolean fromManager = ROLE_PROJECT_MANAGER.equalsIgnoreCase(senderRole) 
                || ROLE_CLIENT_MANAGER.equalsIgnoreCase(senderRole);
        String role = fromManager ? ROLE_PROJECT_MANAGER : ROLE_CLIENT;
        String name = senderName != null && !senderName.isBlank()
                ? senderName.trim()
                : (fromManager ? "Project Manager" : (inquiry.getClient() != null ? inquiry.getClient().getName() : "Client"));

        LocalDateTime now = LocalDateTime.now();
        inquiry.addMessage(new InquiryMessage(inquiry, role, name, text.trim(), now));

        if (fromManager) {
            // Keep legacy "response" fields in sync with the latest manager reply
            inquiry.setResponse(text.trim());
            inquiry.setRespondedAt(now);
            inquiry.setRespondedBy(name);
            inquiry.setStatus("ANSWERED");
        } else {
            inquiry.setStatus("PENDING");
        }

        ClientInquiry saved = inquiryRepository.save(inquiry);

        if (fromManager && saved.getClient() != null) {
            notificationRepository.save(new ClientNotification(
                    saved.getClient(),
                    "Inquiry Responded: " + saved.getSubject(),
                    "Your Project Manager has replied to your inquiry.",
                    "INQUIRY_REPLY",
                    "#client-support"
            ));
        }
        return saved;
    }

    /** Legacy endpoint: a manager reply. Now appended to the conversation thread. */
    public ClientInquiry respond(Long id, String responseText, String respondedBy) {
        return addMessage(id, ROLE_PROJECT_MANAGER, respondedBy != null ? respondedBy : "Project Manager", responseText);
    }

    /**
     * Records official technical feasibility decision by Project Manager (APPROVED or REJECTED)
     */
    public ClientInquiry submitDecision(Long id, String decision, String decisionRemarks, java.math.BigDecimal estimatedBudget, String estimatedDuration, String decidedBy) {
        ClientInquiry inquiry = findById(id);
        String dec = (decision != null && !decision.isBlank()) ? decision.trim().toUpperCase() : "APPROVED";
        inquiry.setPmDecision(dec);
        inquiry.setPmDecisionDate(LocalDateTime.now());
        inquiry.setPmDecisionRemarks(decisionRemarks != null ? decisionRemarks.trim() : "");
        if (estimatedBudget != null) {
            inquiry.setPmEstimatedBudget(estimatedBudget);
        }
        if (estimatedDuration != null && !estimatedDuration.isBlank()) {
            inquiry.setPmEstimatedDuration(estimatedDuration.trim());
        }
        inquiry.setStatus(dec);

        String actor = (decidedBy != null && !decidedBy.isBlank()) ? decidedBy : "Project Manager";
        StringBuilder sb = new StringBuilder();
        sb.append("TECHNICAL FEASIBILITY ASSESSMENT: [").append(dec).append("]\n");
        if (decisionRemarks != null && !decisionRemarks.isBlank()) {
            sb.append("Evaluation: ").append(decisionRemarks.trim()).append("\n");
        }
        if (inquiry.getPmEstimatedBudget() != null) {
            sb.append("Estimated Construction Budget: LKR ").append(inquiry.getPmEstimatedBudget()).append("\n");
        }
        if (inquiry.getPmEstimatedDuration() != null && !inquiry.getPmEstimatedDuration().isBlank()) {
            sb.append("Estimated Construction Duration: ").append(inquiry.getPmEstimatedDuration()).append("\n");
        }
        if ("APPROVED".equalsIgnoreCase(dec)) {
            sb.append("Transmitted to Client Management for formal Contract Agreement & signature.");
        }

        // Deduplicate any previous assessment messages to avoid repeats
        if (inquiry.getMessages() != null) {
            inquiry.getMessages().removeIf(m -> m.getMessage() != null && m.getMessage().contains("TECHNICAL FEASIBILITY ASSESSMENT"));
        }

        inquiry.addMessage(new InquiryMessage(inquiry, ROLE_PROJECT_MANAGER, actor, sb.toString(), LocalDateTime.now()));

        // Contract will be signed by Client Manager in step 4 using existing contract functionality
        inquiry.setContractGenerated(false);
        inquiry.setContractId(null);

        if (inquiry.getClient() != null) {
            String title = "APPROVED".equalsIgnoreCase(dec)
                    ? "Inquiry Feasibility Approved by Project Manager"
                    : "Inquiry Assessment Update from Project Manager";
            String body = "APPROVED".equalsIgnoreCase(dec)
                    ? "Your inquiry (" + inquiry.getSubject() + ") was approved by our Project Manager! Your Client Manager will draft the contract agreement shortly."
                    : "The Project Manager has reviewed your inquiry: " + (decisionRemarks != null ? decisionRemarks : "Assessment completed.");

            notificationRepository.save(new ClientNotification(
                    inquiry.getClient(),
                    title,
                    body,
                    "INQUIRY_DECISION",
                    "#client-support"
            ));
        }

        return inquiryRepository.save(inquiry);
    }

    public ClientInquiry markContractGenerated(Long id, Long contractId) {
        ClientInquiry inquiry = findById(id);
        inquiry.setContractGenerated(true);
        inquiry.setContractId(contractId);
        return inquiryRepository.save(inquiry);
    }

    public ClientInquiry clientAccept(Long id) {
        ClientInquiry inquiry = findById(id);
        inquiry.setClientAccepted(true);
        inquiry.setClientAcceptedAt(LocalDateTime.now());

        String clientName = inquiry.getClient() != null ? inquiry.getClient().getName() : "Client";
        String budgetStr = inquiry.getPmEstimatedBudget() != null
                ? "LKR " + inquiry.getPmEstimatedBudget().toPlainString()
                : (inquiry.getDesign() != null && inquiry.getDesign().getBudget() != null ? "LKR " + inquiry.getDesign().getBudget().toPlainString() : "the proposed budget");

        inquiry.addMessage(new InquiryMessage(
                inquiry,
                ROLE_CLIENT,
                clientName,
                "✓ PROJECT ACCEPTED BY CLIENT: I have reviewed and officially accepted the project proposal and quotation of " + budgetStr + ". Proceeding to make the initial down payment to confirm.",
                LocalDateTime.now()
        ));

        ClientInquiry saved = inquiryRepository.save(inquiry);

        if (saved.getClient() != null) {
            notificationRepository.save(new ClientNotification(
                    saved.getClient(),
                    "Project Accepted: " + saved.getSubject(),
                    "You have accepted the project proposal. Please complete your 20% down payment to initiate construction scheduling.",
                    "INQUIRY_ACCEPTED",
                    "#downpayments"
            ));
        }

        return saved;
    }

    public ClientInquiry markInquiryPaid(Long id, java.math.BigDecimal amount, String refNumber, String paymentMethod) {
        ClientInquiry inquiry = findById(id);
        inquiry.setDownPaymentPaid(true);
        inquiry.setDownPaymentAmount(amount);
        inquiry.setDownPaymentRef(refNumber != null ? refNumber : "PAY-" + System.currentTimeMillis());
        inquiry.setDownPaymentDate(LocalDateTime.now());
        inquiry.setClientAccepted(true);
        if (inquiry.getClientAcceptedAt() == null) {
            inquiry.setClientAcceptedAt(LocalDateTime.now());
        }

        String clientName = inquiry.getClient() != null ? inquiry.getClient().getName() : "Client";
        String method = (paymentMethod != null && !paymentMethod.isBlank()) ? paymentMethod : "Online Card Payment";
        String amtStr = amount != null ? "LKR " + amount.toPlainString() : "initial deposit";

        inquiry.addMessage(new InquiryMessage(
                inquiry,
                ROLE_CLIENT,
                clientName,
                "💳 DOWN PAYMENT COMPLETED: Initial construction down payment of " + amtStr + " has been successfully submitted via " + method + " (Reference #" + inquiry.getDownPaymentRef() + "). Project is now ready for Project Manager initialization!",
                LocalDateTime.now()
        ));

        ClientInquiry saved = inquiryRepository.save(inquiry);

        if (saved.getClient() != null) {
            notificationRepository.save(new ClientNotification(
                    saved.getClient(),
                    "Down Payment Verified: " + saved.getSubject(),
                    "Your down payment of " + amtStr + " has been recorded. Our Project Manager will initialize your construction project shortly.",
                    "INQUIRY_PAID",
                    "#client-support"
            ));
        }

        return saved;
    }

    public ClientInquiry linkProject(Long id, Long projectId) {
        ClientInquiry inquiry = findById(id);
        if (projectId != null) {
            Project project = projectRepository.findById(projectId).orElse(null);
            inquiry.setProject(project);
        }
        return inquiryRepository.save(inquiry);
    }

    @Transactional(readOnly = true)
    public List<ClientInquiry> findByClientId(Long clientId) {
        return inquiryRepository.findByClientIdOrderByCreatedAtDesc(clientId);
    }

    @Transactional(readOnly = true)
    public List<ClientInquiry> findAll() {
        return inquiryRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public ClientInquiry findById(Long id) {
        return inquiryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inquiry not found with id " + id));
    }

    public void delete(Long id) {
        inquiryRepository.deleteById(id);
    }
}
