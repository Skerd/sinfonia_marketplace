/** The form's service area (D143) as the API takes it: sent only when the pin and the radius are both set. */
export function serviceAreaPayload(area: {latitude?: unknown; longitude?: unknown; radiusKm?: unknown} | null | undefined) {
    const latitude = Number(area?.latitude);
    const longitude = Number(area?.longitude);
    const radiusKm = Number(area?.radiusKm);
    const complete = area?.latitude != null && area?.longitude != null && area?.radiusKm != null && area.radiusKm !== ""
        && Number.isFinite(latitude) && Number.isFinite(longitude) && Number.isFinite(radiusKm);
    return complete ? {latitude, longitude, radiusKm} : undefined;
}
