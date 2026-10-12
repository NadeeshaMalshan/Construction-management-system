package com.construction.controller;

import com.construction.enums.ProjectStatus;
import com.construction.enums.PropertyCategory;
import com.construction.model.Project;
import com.construction.model.ProjectRequest;
import com.construction.service.ProjectRequestService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/project-requests")
public class ProjectRequestController {

    private final ProjectRequestService projectRequestService;

    public ProjectRequestController(ProjectRequestService projectRequestService) {
        this.projectRequestService = projectRequestService;
    }

    @PostMapping
    public ResponseEntity<ProjectRequest> create(@Valid @RequestBody ProjectRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(projectRequestService.create(request));
    }

    @GetMapping
    public ResponseEntity<List<ProjectRequest>> findAll(@RequestParam(required = false) Long clientId) {
        if (clientId != null) {
            return ResponseEntity.ok(projectRequestService.findByClientId(clientId));
        }
        return ResponseEntity.ok(projectRequestService.findAll());
    }

    @GetMapping("/forwarded-to-pm")
    public ResponseEntity<List<ProjectRequest>> findForwardedToPm() {
        return ResponseEntity.ok(projectRequestService.findForwardedToPm());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProjectRequest> findById(@PathVariable Long id) {
        return ResponseEntity.ok(projectRequestService.findById(id));
    }

    @PutMapping("/{id}/forward-to-pm")
    public ResponseEntity<ProjectRequest> forwardToPm(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String cmNotes = body.get("cmNotes");
        String forwardedByCm = body.get("forwardedByCm");
        return ResponseEntity.ok(projectRequestService.forwardToPm(id, cmNotes, forwardedByCm));
    }

    @PutMapping("/{id}/pm-reply")
    public ResponseEntity<ProjectRequest> pmReply(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        String pmReply = (String) body.get("pmReply");
        BigDecimal pmEstimatedBudget = null;
        if (body.get("pmEstimatedBudget") != null) {
            try {
                pmEstimatedBudget = new BigDecimal(body.get("pmEstimatedBudget").toString());
            } catch (Exception ignored) {
            }
        }
        String pmEstimatedDuration = (String) body.get("pmEstimatedDuration");
        String pmRespondedBy = (String) body.get("pmRespondedBy");
        return ResponseEntity.ok(projectRequestService.pmReply(id, pmReply, pmEstimatedBudget, pmEstimatedDuration, pmRespondedBy));
    }

    @PutMapping("/{id}/send-to-client")
    public ResponseEntity<ProjectRequest> sendResponseToClient(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String clientMessage = body.get("clientMessage");
        String clientNotifiedBy = body.get("clientNotifiedBy");
        return ResponseEntity.ok(projectRequestService.sendResponseToClient(id, clientMessage, clientNotifiedBy));
    }

    @GetMapping("/custom-designs")
    public ResponseEntity<List<ProjectRequest>> findCustomRequests() {
        return ResponseEntity.ok(projectRequestService.findCustomRequests());
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<ProjectRequest> approve(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> body) {
        String cmNotes = body != null && body.get("cmNotes") != null ? body.get("cmNotes").toString() : null;
        String clientMessage = body != null && body.get("clientMessage") != null ? body.get("clientMessage").toString() : null;
        String approvedBy = body != null && body.get("approvedBy") != null ? body.get("approvedBy").toString() : null;
        BigDecimal pmEstimatedBudget = null;
        if (body != null && body.get("pmEstimatedBudget") != null) {
            try {
                pmEstimatedBudget = new BigDecimal(body.get("pmEstimatedBudget").toString());
            } catch (Exception ignored) {
            }
        }
        String pmEstimatedDuration = body != null && body.get("pmEstimatedDuration") != null ? body.get("pmEstimatedDuration").toString() : null;
        String pmReply = body != null && body.get("pmReply") != null ? body.get("pmReply").toString() : null;
        return ResponseEntity.ok(projectRequestService.approve(id, cmNotes, clientMessage, approvedBy, pmEstimatedBudget, pmEstimatedDuration, pmReply));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<ProjectRequest> reject(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.get("reason") : null;
        String rejectedBy = body != null ? body.get("rejectedBy") : null;
        return ResponseEntity.ok(projectRequestService.reject(id, reason, rejectedBy));
    }

    @PostMapping("/{id}/start-project")
    public ResponseEntity<Project> startProject(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> body,
            @RequestParam(required = false) String startedBy) {
        Project projectData = new Project();
        if (body != null) {
            if (body.get("name") != null) {
                projectData.setName(body.get("name").toString().trim());
            }
            if (body.get("description") != null) {
                projectData.setDescription(body.get("description").toString().trim());
            }
            if (body.get("location") != null) {
                projectData.setLocation(body.get("location").toString().trim());
            }
            if (body.get("category") != null) {
                try {
                    projectData.setCategory(PropertyCategory.valueOf(body.get("category").toString().trim().toUpperCase()));
                } catch (Exception ignored) {
                    projectData.setCategory(PropertyCategory.RESIDENCIES);
                }
            }
            if (body.get("budget") != null) {
                try {
                    projectData.setBudget(new BigDecimal(body.get("budget").toString().trim()));
                } catch (Exception ignored) {
                }
            }
            if (body.get("startDate") != null) {
                try {
                    String sDate = body.get("startDate").toString().trim();
                    if (sDate.length() >= 10) {
                        projectData.setStartDate(LocalDate.parse(sDate.substring(0, 10)));
                    }
                } catch (Exception ignored) {
                }
            }
            if (body.get("endDate") != null && !body.get("endDate").toString().trim().isEmpty()) {
                try {
                    String eDate = body.get("endDate").toString().trim();
                    if (eDate.length() >= 10) {
                        projectData.setEndDate(LocalDate.parse(eDate.substring(0, 10)));
                    }
                } catch (Exception ignored) {
                }
            }
            if (body.get("status") != null) {
                try {
                    projectData.setStatus(ProjectStatus.valueOf(body.get("status").toString().trim().toUpperCase()));
                } catch (Exception ignored) {
                    projectData.setStatus(ProjectStatus.IN_PROGRESS);
                }
            }
            if (body.get("imageUrls") instanceof List<?> list) {
                List<String> urls = new ArrayList<>();
                for (Object item : list) {
                    if (item != null) urls.add(item.toString());
                }
                projectData.setImageUrls(urls);
            }
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(projectRequestService.startProject(id, projectData, startedBy));
    }

    @PutMapping("/{id}/mark-paid")
    public ResponseEntity<ProjectRequest> markPaid(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> body) {
        BigDecimal amount = null;
        if (body != null && body.get("amount") != null) {
            try {
                amount = new BigDecimal(body.get("amount").toString());
            } catch (Exception ignored) {
            }
        }
        String refNumber = body != null && body.get("refNumber") != null ? body.get("refNumber").toString() : null;
        return ResponseEntity.ok(projectRequestService.markDownPaymentPaid(id, amount, refNumber));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        projectRequestService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
