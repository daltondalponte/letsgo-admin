'use client'
import Modal from "../Modal"
import { useEffect, useState } from 'react'
import axios from "axios"

import { Dialog } from '@headlessui/react'
import { useAuth } from "@/context/authContext"

interface TableProps {
    data: {
        users: any[]
    } | null;
}

export default function Table({ data }: TableProps) {
    const [open, setOpen] = useState(false)
    const { user, token } = useAuth();
    const [infoUsers, setUsers] = useState<any>([])
    const [selectedUser, setSelectedUser] = useState<any>(null)

    const handleOpenModal = (item: any) => {
        setOpen(true)
        item.establishment.coordinates = JSON.parse(item?.establishment?.coordinates ?? "")
        setSelectedUser(item)
    }

    useEffect(() => {
        setUsers(data?.users)
    }, [])

    const handleAction = async (id: string) => {
        try {
            const index = infoUsers!?.findIndex((u: any) => u.user.uid === id)
            await axios.put(`https://letsgo.app.br:3008/user/update/professionals/${id}`, {
                state: !infoUsers[index].user.isActive
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'authorization': `Bearer ${token}`
                }
            })

            const res = await fetch(`https://letsgo.app.br:3008/user/find/professionals`, {
                method: "GET",
                headers: {
                    'Content-Type': 'application/json',
                    'authorization': `Bearer ${token}`
                }
            }).then(res => res.json()).then(res => res)

            setUsers(res.users)

        } catch (e) {
            console.error('Erro ao atualizar status do usuário:', e);
        }


    }

    const modalChildren = () => {
        return (
            <>
                <div className="w-auto bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                    <div className=" flex-col pr-11">
                        <div className="w-full mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                            <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                                Informações do usuário
                            </Dialog.Title>
                            <div className="w-full mt-5 grid justify-between grid-cols-2 gap-14">
                                <div className="font-bold">Nome</div>
                                <div>{selectedUser?.user?.name}</div>
                            </div>
                            <div className="w-full mt-5 grid justify-between grid-cols-2 gap-14">
                                <div className="font-bold">Email</div>
                                <div>{selectedUser?.user?.email}</div>
                            </div>
                            <div className="w-full mt-5 grid justify-between grid-cols-2 gap-14">
                                <div className="font-bold">CNPJ</div>
                                <div>{selectedUser?.user?.document}</div>
                            </div>
                            <div className="w-full mt-5 mb-5 grid justify-between grid-cols-2 gap-14">
                                <div className="font-bold">Status</div>
                                <div>{selectedUser?.user?.isActive ? "Ativo" : "Inativo"}</div>
                            </div>
                        </div>

                        <div className="w-full mt-10 text-justify sm:ml-4 sm:mt-0 sm:text-left">
                            <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                                Informações do Estabelecimento
                            </Dialog.Title>
                            <div className="w-full mt-5 grid justify-between grid-cols-2 gap-14">
                                <div className="font-bold">Nome</div>
                                <div>{selectedUser?.establishment?.name}</div>
                            </div>
                            <div className="w-full mt-5 grid justify-between grid-cols-2 gap-14">
                                <div className="font-bold">Localização</div>
                                <a className="text-blue-700" target="_blank" href={`https://www.google.com/maps/search/?api=1&query=${selectedUser?.establishment?.coordinates.latitude}%2C${selectedUser?.establishment?.coordinates.longitude}`}> Ver no Mapa</a>
                            </div>
                            <div className="w-full mt-5 grid justify-between grid-cols-2 gap-14">
                                <div className="font-bold">Endereço</div>
                                <div>{selectedUser?.establishment?.address}</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                    <button
                        type="button"
                        className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                        onPress={() => setOpen(false)}
                    >
                        Fechar
                    </button>
                </div>
            </>
        )
    }



    return (
        <>
            <div className="overflow-x-auto w-full">
                <div className="flex items-center justify-center font-sans overflow-hidden">
                    <div className="w-full lg:w-5/6">
                        <div className="bg-white shadow-md rounded my-6">
                            <table className="min-w-max w-full table-auto">
                                <thead>
                                    <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                                        <th className="py-3 px-6 text-left">Nome</th>
                                        <th className="py-3 px-6 text-left">Email</th>
                                        <th className="py-3 px-6 text-center">CNPJ</th>
                                        <th className="py-3 px-6 text-center">Status</th>
                                        <th className="py-3 px-6 text-center">ações</th>
                                    </tr>
                                </thead>
                                <tbody className="text-gray-600 text-sm font-light">
                                    {infoUsers?.map((item: any, index: number) => {

                                        return (
                                            <tr key={`user-${item?.user?.uid}-${index}`} role="button" onClick={(e) => {
                                                handleOpenModal(item)
                                            }} className="border-b border-gray-200 hover:bg-gray-100 cursor-pointer">
                                                <td className="py-3 px-6 text-left whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <span className="font-medium">{item?.user?.name}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-6 text-left">
                                                    <div className="flex items-center">
                                                        {/* <div className="mr-2">
                                                        <img className="w-6 h-6 rounded-full" src="https://randomuser.me/api/portraits/men/1.jpg" />
                                                    </div> */}
                                                        <span>{item?.user?.email}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-6 text-center">
                                                    <div className="flex items-center justify-center">
                                                        <span>{item?.user?.document}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-6 text-center">
                                                    <span className={`${item?.user?.isActive ? 'bg-green-200 text-green-600' : 'bg-yellow-200 text-yellow-600'} py-1 px-3 rounded-full text-xs`}>{item?.user?.isActive ? "Ativo" : "Inativo"}</span>
                                                </td>
                                                <td className="py-3 px-6 text-center">
                                                    <button onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleAction(item?.user?.uid)
                                                    }} className={`pl-6  pr-6 py-2 rounded-md ${item?.user?.isActive ? 'bg-red-200 hover:bg-red-100' : 'bg-green-200 hover:bg-green-100'} `}>{item?.user?.isActive ? "Inativar" : "Ativar"}</button>

                                                </td>
                                            </tr>
                                        )
                                    })

                                    }

                                </tbody>
                            </table>
                        </div>
                    </div>
                    <Modal children={modalChildren()} open={open} setOpen={setOpen} />
                </div>

            </div>

        </>
    )
}