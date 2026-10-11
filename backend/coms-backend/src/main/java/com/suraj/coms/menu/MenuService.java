package com.suraj.coms.menu;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class MenuService {

    private final MenuItemRepository menuItemRepository;

    public MenuService(MenuItemRepository menuItemRepository) {
        this.menuItemRepository = menuItemRepository;
    }

    @Transactional(readOnly = true)
    public List<MenuItemResponse> getAvailableMenu() {
        return menuItemRepository.findByAvailableTrueOrderByCategoryAscNameAsc()
                .stream()
                .map(item -> new MenuItemResponse(
                        item.getId(),
                        item.getName(),
                        item.getCategory(),
                        item.getPrice()
                ))
                .toList();
    }
}
