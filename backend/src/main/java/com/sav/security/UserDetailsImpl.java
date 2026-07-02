package com.sav.security;

import com.sav.model.Utilisateur;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;

/**
 * Implémentation de UserDetails pour Spring Security.
 */
@AllArgsConstructor
public class UserDetailsImpl implements UserDetails {

    @Getter
    private Long id;
    private String email;
    private String motDePasse;
    private Collection<? extends GrantedAuthority> authorities;
    private boolean actif;

    public static UserDetailsImpl build(Utilisateur utilisateur) {
        GrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + utilisateur.getRole().name());
        return new UserDetailsImpl(
                utilisateur.getId(),
                utilisateur.getEmail(),
                utilisateur.getMotDePasse(),
                Collections.singletonList(authority),
                utilisateur.isActif()
        );
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return motDePasse;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return actif;
    }
}
