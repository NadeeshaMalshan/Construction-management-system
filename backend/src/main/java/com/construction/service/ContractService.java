package com.construction.service;

import com.construction.exception.BadRequestException;
import com.construction.exception.ResourceNotFoundException;
import com.construction.model.Client;
import com.construction.model.Contract;
import com.construction.repository.ClientRepository;
import com.construction.repository.ContractRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@Transactional
public class ContractService {

    private final ContractRepository contractRepository;
    private final ClientRepository clientRepository;
    private final com.construction.repository.ClientNotificationRepository notificationRepository;

    public ContractService(ContractRepository contractRepository,
                           ClientRepository clientRepository,
                           com.construction.repository.ClientNotificationRepository notificationRepository) {
        this.contractRepository = contractRepository;
        this.clientRepository = clientRepository;
        this.notificationRepository = notificationRepository;
    }

    public Contract create(Contract contract) {
        Client resolvedClient = resolveClient(contract.getClient());
        contract.setClient(resolvedClient);
        if (contract.getStatus() == null) {
            contract.setStatus("ACTIVE");
        }
        validateContractDates(contract);
        Contract saved = contractRepository.save(contract);

        // Notify client about the submitted contract agreement
        if (resolvedClient != null && notificationRepository != null) {
            try {
                com.construction.model.ClientNotification notif = new com.construction.model.ClientNotification(
                        resolvedClient,
                        "Official Contract Issued: " + (saved.getTitle() != null ? saved.getTitle() : saved.getContractNumber()),
                        "Your Client Manager has issued an official construction contract (" + saved.getContractNumber()
                                + "). Amount: LKR " + String.format("%,.2f", saved.getAmount() != null ? saved.getAmount() : 0.0)
                                + ". Please review it in your Contracts tab.",
                        "CONTRACT_ALERT",
                        "#contracts"
                );
                notificationRepository.save(notif);
            } catch (Exception ex) {
                // Non-fatal notification failure
            }
        }

        return saved;
    }

    public List<Contract> findAll() {
        return contractRepository.findAll();
    }

    public List<Contract> findByClientId(Long clientId) {
        return contractRepository.findByClientId(clientId);
    }

    public List<Contract> findExpiringSoon(int days) {
        LocalDate future = LocalDate.now().plusDays(days > 0 ? days : 60);
        return contractRepository.findExpiringOrExpired(future);
    }

    public List<Contract> findExpired() {
        return contractRepository.findExpired(LocalDate.now());
    }

    public Contract findById(Long id) {
        return contractRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Contract not found with id " + id));
    }

    public Contract update(Long id, Contract contract) {
        validateContractDates(contract);
        Contract existing = findById(id);
        existing.setContractNumber(contract.getContractNumber());
        existing.setTitle(contract.getTitle());
        existing.setAmount(contract.getAmount());
        existing.setSignedDate(contract.getSignedDate());
        existing.setEndDate(contract.getEndDate());
        existing.setStatus(contract.getStatus());
        existing.setTerms(contract.getTerms());
        if (contract.getClient() != null && contract.getClient().getId() != null) {
            existing.setClient(resolveClient(contract.getClient()));
        }
        return contractRepository.save(existing);
    }

    private void validateContractDates(Contract contract) {
        if (contract.getSignedDate() == null) {
            throw new BadRequestException("Contract signed date is required");
        }
        if (contract.getEndDate() != null && contract.getEndDate().isBefore(contract.getSignedDate())) {
            throw new BadRequestException("Contract end date cannot be earlier than signed date");
        }
    }

    public void delete(Long id) {
        Contract existing = findById(id);
        contractRepository.delete(existing);
    }

    private Client resolveClient(Client client) {
        if (client == null || client.getId() == null) {
            throw new BadRequestException("Client id is required");
        }
        return clientRepository.findById(client.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Client not found with id " + client.getId()));
    }
}
