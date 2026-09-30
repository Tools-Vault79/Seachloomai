// SeachLoom AI optional advertising placement controls.
// Slots are intentionally hidden by default. Activate a slot only when a banner is supplied.
function removeAdSlot(button){
  const slot=button.closest(".ad-slot,.ad-rail");
  if(slot) slot.remove();
}
