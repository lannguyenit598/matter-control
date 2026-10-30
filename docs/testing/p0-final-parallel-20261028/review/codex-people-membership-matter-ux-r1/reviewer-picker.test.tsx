import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
const actions = vi.hoisted(() => ({ grant: vi.fn(), search: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => ({refresh: vi.fn(), push: vi.fn()}) }))
vi.mock('@/features/matters/actions', () => ({grantMatterMemberAction: actions.grant}))
import { GrantMatterMemberForm } from '@/features/matters/components/grant-matter-member-form'

it('removes a no-longer-eligible person after the server reread updates candidates', async () => {
 const view = render(<GrantMatterMemberForm matterId="m1" ifMatch='"1"' candidates={[{userId:'u1',displayName:'Alex'}]} />)
 fireEvent.click(screen.getByRole('button',{name:'Add to matter'}))
 fireEvent.click(await screen.findByRole('radio',{name:'Alex'}))
 view.rerender(<GrantMatterMemberForm matterId="m1" ifMatch='"2"' candidates={[]} />)
 await new Promise(r=>setTimeout(r,350))
 expect(screen.queryByRole('radio',{name:'Alex'})).toBeNull()
})

import { SearchPicker } from '@/components/molecules/search-picker'
it('does not offer unselected results from the previous query while a new query is pending', async () => {
 const search = vi.fn(async (q:string) => q ? new Promise<never>(()=>{}) : ({status:'ok' as const, options:[{value:'u1',label:'Alex'}]}))
 render(<SearchPicker name="userId" legend="Person" searchLabel="Search people" search={search} debounceMs={0} />)
 await screen.findByRole('radio',{name:'Alex'})
 fireEvent.change(screen.getByRole('searchbox'),{target:{value:'Bao'}})
 await waitFor(()=>expect(search).toHaveBeenCalledWith('Bao'))
 expect(screen.queryByRole('radio',{name:'Alex'})).toBeNull()
})
