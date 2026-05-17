/**
 * ProfileAvatar — player profile picture in the top-left corner.
 *
 * Replaces the previous Ribbon (username + tide kanji) per operator direction
 * 2026-05-16: "add user profile picture in the top-left, big circle, no
 * username for now." Pure visual identity — circular crop, no labels.
 *
 * Uses one of the existing caretaker fullbody art assets as the placeholder
 * (defaults to Kaori — the wood caretaker, matching the cycle-1 wood = player
 * side matchup). Image is object-position centered on the face. Easy to swap
 * via the `src` prop once a real player-identity record lands in GameState.
 *
 * Cycle-1: no GameState player-identity field yet (mirror of the EnemyCorner
 * substrate gap). Component is statically rendered for now.
 */

"use client";

interface ProfileAvatarProps {
  /** Image src for the PFP. Defaults to Kaori (wood caretaker, player side). */
  readonly src?: string;
  /** Accessible label for the avatar. */
  readonly label?: string;
}

export function ProfileAvatar({
  src = "/art/caretakers/caretaker-kaori-fullbody.png",
  label = "Player",
}: ProfileAvatarProps) {
  return (
    <aside className="hud-profile-avatar" aria-label={label}>
      <div className="hud-profile-avatar__circle">
        <img
          className="hud-profile-avatar__image"
          src={src}
          alt={label}
          loading="lazy"
        />
      </div>
    </aside>
  );
}
