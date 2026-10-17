import SmallScreenNotice from '../webgl/SmallScreenNotice'

/**
 * Courtside's wording for the shared notice.
 *
 * A wrapper rather than props at the call site: this is copy, and copy that
 * sits inline in a 700-line viewer is copy nobody finds again.
 */
export default function CourtSmallScreenNotice() {
    return (
        <SmallScreenNotice
            storageKey="nba-court-small-screen-v1"
            title="Better on a bigger screen"
            body={
                'This one renders a full arena floor in 3D, and most of what ' +
                'makes it worth looking at \u2014 the lighting on the boards, the ' +
                'marks out on the court \u2014 is hard to see at this size. It all ' +
                'works here, but a laptop does it justice.'
            }
            dismissLabel="Have a look anyway"
        />
    )
}
