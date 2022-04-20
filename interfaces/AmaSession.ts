export type AmaSession = {
  session_id: number
  name: string
  description: string
  hosts: string
  created_at: Date
  owner: string
  status: number
  access_code_hash: string
  statusName: string
  req_access_code: boolean
}