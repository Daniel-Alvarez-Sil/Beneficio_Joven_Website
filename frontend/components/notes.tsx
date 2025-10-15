<TabsContent value="solicitudes" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <CardTitle>Revisión de solicitudes de negocio</CardTitle>
                <div className="flex flex-col md:flex-row gap-2">
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-gray-500" />
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Buscar por negocio, RFC, correo o usuario…"
                      className="w-[260px]"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="border rounded-md px-3 py-2 bg-white"
                  >
                    <option value="En revision">En revisión</option>
                    <option value="Aprobada">Aprobadas</option>
                    <option value="Rechazada">Rechazadas</option>
                    <option value="Todas">Todas</option>
                  </select>
                </div>
              </CardHeader>

              <CardContent>
                {loadingSolicitudes ? (
                  <div className="flex items-center justify-center py-16 text-gray-500">
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Cargando solicitudes…
                  </div>
                ) : solicitudesFiltradas.length === 0 ? (
                  <div className="py-10 text-center text-gray-500">
                    No hay solicitudes {statusFilter !== "Todas" ? `con estado "${statusFilter}"` : ""}.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {solicitudesFiltradas.map((s) => (
                      <Card key={s.id} className="hover:shadow-sm transition">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback>
                                  {s.negocio?.nombre?.charAt(0) ?? "N"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-semibold">{s.negocio?.nombre}</div>
                                <div className="text-xs text-gray-600">{s.negocio?.rfc}</div>
                                <div className="text-xs text-gray-600">
                                  Creada: {fmtFecha(s.fecha_creacion)}
                                </div>
                              </div>
                            </div>
                            <Badge
                              variant={
                                s.estatus === "En revision"
                                  ? "secondary"
                                  : s.estatus === "Aprobada"
                                  ? "default"
                                  : "destructive"
                              }
                            >
                              {s.estatus}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="p-2 bg-gray-50 rounded">
                              <div className="flex items-center gap-1 font-medium">
                                <UserCircle2 className="w-4 h-4" /> Admin
                              </div>
                              <div>{s.administrador?.nombre}</div>
                              <div className="text-xs text-gray-600">{s.administrador?.usuario}</div>
                            </div>
                            <div className="p-2 bg-gray-50 rounded">
                              <div className="flex items-center gap-1 font-medium">
                                <Building2 className="w-4 h-4" /> Negocio
                              </div>
                              <div>{s.negocio?.correo}</div>
                              <div className="text-xs text-gray-600">{s.negocio?.telefono}</div>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => verDetalle(s.id)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Ver
                            </Button>

                            {s.estatus === "En revision" && (
                              <>
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => aprobarSolicitud(s.id)}
                                  disabled={accionLoading}
                                >
                                  {accionLoading ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                  )}
                                  Aprobar
                                </Button>

                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    setDetalle(s);
                                    setOpenRechazar(true);
                                  }}
                                  disabled={accionLoading}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Rechazar
                                </Button>
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
                  </Tabs>
                </div>
          
                {/* ======= Dialog Detalle ======= */}
                <Dialog open={openDetalle} onOpenChange={setOpenDetalle}>
                  <DialogContent className="max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>Detalle de Solicitud</DialogTitle>
                    </DialogHeader>
          
                    {!detalle ? (
                      <div className="flex items-center justify-center py-10 text-gray-500">
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Cargando…
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-sm">Paso 1: Datos del Administrador</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-1 text-sm">
                              <div><span className="font-medium">Nombre: </span>{detalle.administrador.nombre} {detalle.administrador.apellido_paterno} {detalle.administrador.apellido_materno}</div>
                              <div><span className="font-medium">Usuario: </span>{detalle.administrador.usuario}</div>
                              <div><span className="font-medium">Correo: </span>{detalle.administrador.correo}</div>
                              <div><span className="font-medium">Teléfono: </span>{detalle.administrador.telefono}</div>
                            </CardContent>
                          </Card>
          
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-sm">Paso 2: Datos del Negocio</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-1 text-sm">
                              <div><span className="font-medium">Nombre: </span>{detalle.negocio.nombre}</div>
                              <div><span className="font-medium">RFC: </span>{detalle.negocio.rfc}</div>
                              <div><span className="font-medium">Correo: </span>{detalle.negocio.correo}</div>
                              <div><span className="font-medium">Teléfono: </span>{detalle.negocio.telefono}</div>
                              <div><span className="font-medium">Razón Social: </span>{detalle.negocio.razon_social ?? "-"}</div>
                              <div><span className="font-medium">Sitio Web: </span>{detalle.negocio.sitio_web ?? "-"}</div>
                              <div><span className="font-medium">Dirección: </span>
                                {[detalle.negocio.calle, detalle.negocio.numero_ext, detalle.negocio.numero_int, detalle.negocio.colonia, detalle.negocio.municipio, detalle.negocio.estado, detalle.negocio.cp]
                                  .filter(Boolean)
                                  .join(", ") || "-"}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
          
                        {detalle.estatus === "En revision" && (
                          <div className="flex gap-2 justify-end">
                            <Button
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => aprobarSolicitud(detalle.id)}
                              disabled={accionLoading}
                            >
                              {accionLoading ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                              )}
                              Aprobar
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => setOpenRechazar(true)}
                              disabled={accionLoading}
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Rechazar
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
          
                {/* ======= Dialog Rechazar ======= */}
                <Dialog open={openRechazar} onOpenChange={setOpenRechazar}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Rechazar solicitud</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600">
                        Escribe el motivo de rechazo. Se enviará al solicitante.
                      </p>
                      <Textarea
                        placeholder="Ej. RFC inválido o documentos incompletos."
                        value={motivoRechazo}
                        onChange={(e) => setMotivoRechazo(e.target.value)}
                      />
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setOpenRechazar(false)}>
                          Cancelar
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => detalle && rechazarSolicitud(detalle.id, motivoRechazo)}
                          disabled={accionLoading}
                        >
                          {accionLoading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <XCircle className="w-4 h-4 mr-2" />
                          )}
                          Confirmar rechazo
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>